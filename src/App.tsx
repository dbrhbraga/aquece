import React, { useState, useEffect } from 'react';
import { User, Training } from './types';
import { INITIAL_USERS, INITIAL_TRAININGS } from './data';
import UserSelector from './components/UserSelector';
import TrainingList from './components/TrainingList';
import StatsDashboard from './components/StatsDashboard';
import { Activity, Calendar, BarChart3, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from './firebase';

const LOCAL_STORAGE_ACTIVE_USER_KEY = 'corrida_tracker_active_user_v1';

const AVATAR_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-fuchsia-500 to-purple-600',
  'from-cyan-500 to-sky-600',
  'from-violet-500 to-purple-600',
];

export default function App() {
  // App State - Loaded immediately to eliminate loading delay
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [selectedUserId, setSelectedUserId] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_ACTIVE_USER_KEY) || 'user-deborah';
  });
  const [trainings, setTrainings] = useState<Training[]>(INITIAL_TRAININGS);
  const [activeTab, setActiveTab] = useState<'planilha' | 'graficos'>('planilha');
  const [isLoaded, setIsLoaded] = useState(false);

  // Force exactly 2 seconds delay on the loading screen for a smooth transition
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Load state and listen to Firestore changes on mount
  useEffect(() => {
    // 1. Subscribe to Users
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), async (snapshot) => {
      const usersList: User[] = [];
      snapshot.forEach((doc) => {
        usersList.push({ id: doc.id, ...doc.data() } as User);
      });

      const oldUserIds = ['user-1', 'user-2', 'user-3', 'user-sarah'];
      const hasOldUsers = usersList.some(u => oldUserIds.includes(u.id));

      if (hasOldUsers || usersList.length === 0) {
        console.log('Purging old model users and ensuring Déborah Braga exists...');
        try {
          // Deletar usuários antigos do Firestore em paralelo
          const deleteUserPromises = usersList
            .filter(u => oldUserIds.includes(u.id))
            .map(u => deleteDoc(doc(db, 'users', u.id)));
          await Promise.all(deleteUserPromises);

          // Criar Déborah Braga no Firestore
          await setDoc(doc(db, 'users', 'user-deborah'), {
            name: 'Déborah Braga',
            avatarColor: 'from-rose-500 to-pink-600'
          });

          // Seeding initial trainings for Déborah Braga in parallel
          const seedTrainingPromises = INITIAL_TRAININGS.map(t => 
            setDoc(doc(db, 'trainings', t.id), {
              userId: 'user-deborah',
              week: t.week,
              description: t.description,
              dayOfWeek: t.dayOfWeek,
              plannedKm: t.plannedKm,
              completedKm: t.completedKm,
              done: t.done,
              notes: t.notes || ''
            })
          );
          await Promise.all(seedTrainingPromises);
        } catch (err) {
          console.error('Error migrating or seeding data to Firestore:', err);
        }
      } else {
        setUsers(usersList);
        
        // Select active user
        const storedActiveUser = localStorage.getItem(LOCAL_STORAGE_ACTIVE_USER_KEY);
        setSelectedUserId((currentId) => {
          if (!currentId || !usersList.some(u => u.id === currentId)) {
            if (storedActiveUser && usersList.some(u => u.id === storedActiveUser)) {
              return storedActiveUser;
            }
            const deborahObj = usersList.find(u => u.id === 'user-deborah' || u.name === 'Déborah Braga');
            return deborahObj ? deborahObj.id : (usersList[0]?.id || '');
          }
          return currentId;
        });
      }
    }, (error) => {
      console.error('Error listening to users collection:', error);
    });

    // 2. Subscribe to Trainings and purge old orphaned trainings in parallel
    const unsubscribeTrainings = onSnapshot(collection(db, 'trainings'), async (snapshot) => {
      const trainingsList: Training[] = [];
      const oldUserIds = ['user-1', 'user-2', 'user-3', 'user-sarah'];
      const trainingsToDelete: string[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (oldUserIds.includes(data.userId)) {
          trainingsToDelete.push(doc.id);
        } else {
          trainingsList.push({ id: doc.id, ...data } as Training);
        }
      });

      if (trainingsToDelete.length > 0) {
        console.log(`Deletando ${trainingsToDelete.length} treinos órfãos em paralelo...`);
        try {
          await Promise.all(trainingsToDelete.map(id => deleteDoc(doc(db, 'trainings', id))));
        } catch (err) {
          console.error('Error deleting orphaned trainings:', err);
        }
      }

      // Check if user-deborah has any trainings in Firestore. If she doesn't, seed INITIAL_TRAININGS so they exist as actual Firestore documents
      const deborahTrainings = trainingsList.filter(t => t.userId === 'user-deborah');
      if (deborahTrainings.length === 0) {
        console.log('No trainings found for Déborah Braga in Firestore. Seeding INITIAL_TRAININGS...');
        try {
          const seedTrainingPromises = INITIAL_TRAININGS.map(t => 
            setDoc(doc(db, 'trainings', t.id), {
              userId: 'user-deborah',
              week: t.week,
              description: t.description,
              dayOfWeek: t.dayOfWeek,
              plannedKm: t.plannedKm,
              completedKm: t.completedKm,
              done: t.done,
              notes: t.notes || ''
            })
          );
          await Promise.all(seedTrainingPromises);
          // Once the write completes, onSnapshot will fire again with the new seeded workouts
          return;
        } catch (err) {
          console.error('Error seeding trainings for Déborah Braga:', err);
        }
      }

      setTrainings(trainingsList);
    }, (error) => {
      console.error('Error listening to trainings collection:', error);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeTrainings();
    };
  }, []);

  // Save selected user to localStorage
  useEffect(() => {
    if (selectedUserId) {
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_USER_KEY, selectedUserId);
    }
  }, [selectedUserId]);

  // Action: Add new athlete user
  const handleAddUser = async (name: string) => {
    const randomGradient = AVATAR_GRADIENTS[Math.floor(Math.random() * AVATAR_GRADIENTS.length)];
    const newUserId = `user-${Date.now()}`;
    try {
      await setDoc(doc(db, 'users', newUserId), {
        name,
        avatarColor: randomGradient,
      });
      setSelectedUserId(newUserId); // auto-select newly created athlete
    } catch (err) {
      console.error('Error adding user to Firestore:', err);
    }
  };

  // Action: Delete user and their associated trainings
  const handleDeleteUser = async (userIdToDelete: string) => {
    try {
      // Delete user from Firestore
      await deleteDoc(doc(db, 'users', userIdToDelete));

      // Delete associated trainings in Firestore
      const trainingsToDelete = trainings.filter(t => t.userId === userIdToDelete);
      await Promise.all(trainingsToDelete.map(t => deleteDoc(doc(db, 'trainings', t.id))));

      // Update selected user
      setSelectedUserId((currentId) => {
        if (currentId === userIdToDelete) {
          const remainingUsers = users.filter((u) => u.id !== userIdToDelete);
          return remainingUsers[0]?.id || '';
        }
        return currentId;
      });
    } catch (err) {
      console.error('Error deleting user from Firestore:', err);
    }
  };

  // Action: Add new training workout
  const handleAddTraining = async (newTrainingData: Omit<Training, 'id' | 'userId'>) => {
    const newTrainingId = `t-${Date.now()}`;
    try {
      await setDoc(doc(db, 'trainings', newTrainingId), {
        userId: selectedUserId,
        week: newTrainingData.week,
        description: newTrainingData.description,
        dayOfWeek: newTrainingData.dayOfWeek,
        plannedKm: newTrainingData.plannedKm,
        completedKm: newTrainingData.completedKm,
        done: newTrainingData.done,
        notes: newTrainingData.notes || ''
      });
    } catch (err) {
      console.error('Error adding training to Firestore:', err);
    }
  };

  // Action: Update training properties (supports single field or multiple fields via object)
  const handleUpdateTraining = async (id: string, fieldOrFields: keyof Training | Partial<Training>, value?: any) => {
    try {
      if (typeof fieldOrFields === 'object') {
        await updateDoc(doc(db, 'trainings', id), fieldOrFields);
      } else {
        await updateDoc(doc(db, 'trainings', id), {
          [fieldOrFields]: value
        });
      }
    } catch (err) {
      console.error('Error updating training in Firestore:', err);
    }
  };

  // Action: Delete training
  const handleDeleteTraining = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'trainings', id));
    } catch (err) {
      console.error('Error deleting training from Firestore:', err);
    }
  };


  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg text-white font-mono">
        <div className="text-center">
          <Activity size={32} className="text-brand-neon animate-pulse mx-auto mb-4" />
          <p className="text-xs uppercase tracking-widest opacity-60">Carregando planilha...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-[#F4F4F4] flex flex-col antialiased font-sans">
      
      {/* Upper Navigation Header bar - Editorial Style */}
      <header className="bg-brand-bg border-b border-white/10 sticky top-0 z-30" id="app-header">
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-brand-neon flex items-center justify-center text-black font-black tracking-tighter shadow-lg shadow-brand-neon/10">
              <Activity size={22} strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black tracking-tighter italic">AQUECE.</span>
                <span className="text-[9px] font-mono opacity-40 uppercase tracking-[0.25em]">Lab de Performance</span>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/50 mt-0.5">
                Treinos Semanais de Corrida e Estatísticas de Volume
              </p>
            </div>
          </div>

          {/* Core Tab Switches - High Contrast Mono Style */}
          <div className="flex bg-white/5 p-1 border border-white/10 self-start md:self-center">
            <button
              id="tab-planilha-btn"
              onClick={() => setActiveTab('planilha')}
              className={`flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-widest transition-all cursor-pointer ${
                activeTab === 'planilha'
                  ? 'bg-brand-neon text-black font-bold'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar size={13} />
              <span>Planilha</span>
            </button>
            <button
              id="tab-graficos-btn"
              onClick={() => setActiveTab('graficos')}
              className={`flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-widest transition-all cursor-pointer ${
                activeTab === 'graficos'
                  ? 'bg-brand-neon text-black font-bold'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 size={13} />
              <span>Estatísticas</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body Layout */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
        
        {/* User Selector Component (Multi-user) */}
        <UserSelector
          users={users}
          selectedUserId={selectedUserId}
          onSelectUser={setSelectedUserId}
          onAddUser={handleAddUser}
          onDeleteUser={handleDeleteUser}
        />

        {/* Dynamic Tab Switching Content rendering */}
        <div className="mt-4">
          {activeTab === 'planilha' ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <TrainingList
                trainings={trainings}
                userId={selectedUserId}
                onUpdateTraining={handleUpdateTraining}
                onDeleteTraining={handleDeleteTraining}
                onAddTraining={handleAddTraining}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <StatsDashboard trainings={trainings} userId={selectedUserId} />
            </motion.div>
          )}
        </div>
      </main>

      {/* Polish footer */}
      <footer className="bg-brand-bg border-t border-white/5 py-8 mt-16 text-center text-[10px] font-mono uppercase tracking-widest text-white/40">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white/30">
            <Info size={13} className="text-brand-neon" />
            <span>Sincronizado em tempo real na nuvem do Firebase.</span>
          </div>
          <div>
            <span>Aquece // Est. 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
