import React, { useState, useEffect } from 'react';
import { User, Training, GroupMember } from './types';
import { INITIAL_USERS, INITIAL_TRAININGS } from './data';
import UserSelector from './components/UserSelector';
import TrainingList from './components/TrainingList';
import StatsDashboard from './components/StatsDashboard';
import AuthScreen from './components/AuthScreen';
import { Activity, Calendar, BarChart3, Info, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { db, auth } from './firebase';

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
  // Authentication State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // App State - Loaded immediately to eliminate loading delay
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [activeTab, setActiveTab] = useState<'planilha' | 'graficos'>('planilha');
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Observe Authentication changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthChecking(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // Force exactly 2 seconds delay on the loading screen for a smooth transition once authenticated
  useEffect(() => {
    if (!currentUser) return;
    setIsLoaded(false);
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentUser]);

  // Load state and listen to Firestore changes on mount (scoped to currentUser)
  useEffect(() => {
    if (!currentUser) {
      setUsers([]);
      setTrainings([]);
      setSelectedUserId('');
      return;
    }

    // 1. Subscribe to Users globally
    const qUsers = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(qUsers, async (snapshot) => {
      const usersList: User[] = [];
      snapshot.forEach((doc) => {
        usersList.push({ id: doc.id, ...doc.data() } as User);
      });

      const userOwnedProfiles = usersList.filter(u => u.ownerId === currentUser.uid);
      if (userOwnedProfiles.length === 0) {
        console.log('No athlete profiles found for this user. Creating default profile...');
        try {
          const defaultAthleteId = `user-athlete-${currentUser.uid}`;
          await setDoc(doc(db, 'users', defaultAthleteId), {
            name: currentUser.displayName || 'Minha Planilha',
            type: 'atleta',
            avatarColor: 'from-rose-500 to-pink-600',
            ownerId: currentUser.uid
          });
        } catch (err) {
          console.error('Error creating default athlete profile:', err);
        }
      } else {
        setUsers(usersList);
        
        // Select active user
        const storedActiveUserKey = `${LOCAL_STORAGE_ACTIVE_USER_KEY}_${currentUser.uid}`;
        const storedActiveUser = localStorage.getItem(storedActiveUserKey);
        
        setSelectedUserId((currentId) => {
          if (!currentId || !usersList.some(u => u.id === currentId)) {
            if (storedActiveUser && usersList.some(u => u.id === storedActiveUser)) {
              return storedActiveUser;
            }
            return userOwnedProfiles[0]?.id || usersList[0]?.id || '';
          }
          return currentId;
        });
      }
    }, (error) => {
      console.error('Error listening to users collection:', error);
    });

    // 2. Subscribe to Trainings for the selected athlete
    let qTrainings;
    if (selectedUserId) {
      qTrainings = query(collection(db, 'trainings'), where('userId', '==', selectedUserId));
    } else {
      qTrainings = query(collection(db, 'trainings'), where('ownerId', '==', currentUser.uid));
    }
    const unsubscribeTrainings = onSnapshot(qTrainings, async (snapshot) => {
      const trainingsList: Training[] = [];
      snapshot.forEach((doc) => {
        trainingsList.push({ id: doc.id, ...doc.data() } as Training);
      });

      // If the list is empty and we have a selected athlete, check if we need to seed the INITIAL_TRAININGS
      const isSeededKey = `corrida_tracker_seeded_${currentUser.uid}_${selectedUserId}`;
      const isSeeded = localStorage.getItem(isSeededKey);
      
      if (trainingsList.length === 0 && selectedUserId && !isSeeded) {
        console.log('No trainings found for this athlete. Seeding initial trainings...');
        localStorage.setItem(isSeededKey, 'true');
        try {
          const seedTrainingPromises = INITIAL_TRAININGS.map(t => {
            const newTrainingId = `t-${currentUser.uid}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
            return setDoc(doc(db, 'trainings', newTrainingId), {
              userId: selectedUserId,
              week: t.week,
              description: t.description,
              dayOfWeek: t.dayOfWeek,
              plannedKm: t.plannedKm,
              completedKm: t.completedKm,
              done: t.done,
              notes: t.notes || '',
              ownerId: currentUser.uid
            });
          });
          await Promise.all(seedTrainingPromises);
          return;
        } catch (err) {
          console.error('Error seeding trainings for user:', err);
        }
      }

      setTrainings(trainingsList);
    }, (error) => {
      console.error('Error listening to trainings collection:', error);
    });

    // 3. Subscribe to Group Members globally to enable multi-user interaction
    const qMembers = query(collection(db, 'group_members'));
    const unsubscribeMembers = onSnapshot(qMembers, (snapshot) => {
      const membersList: GroupMember[] = [];
      snapshot.forEach((doc) => {
        membersList.push({ id: doc.id, ...doc.data() } as GroupMember);
      });
      setGroupMembers(membersList);
    }, (error) => {
      console.error('Error listening to group_members collection:', error);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeTrainings();
      unsubscribeMembers();
    };
  }, [currentUser, selectedUserId]);

  // Save selected user to localStorage
  useEffect(() => {
    if (currentUser && selectedUserId) {
      const storedActiveUserKey = `${LOCAL_STORAGE_ACTIVE_USER_KEY}_${currentUser.uid}`;
      localStorage.setItem(storedActiveUserKey, selectedUserId);
    }
  }, [currentUser, selectedUserId]);

  // Action: Add new running group or athlete profile
  const handleAddUser = async (name: string, type: 'grupo' | 'atleta' = 'atleta') => {
    if (!currentUser) return;
    const randomGradient = type === 'grupo' 
      ? 'from-indigo-600 to-purple-800' 
      : AVATAR_GRADIENTS[Math.floor(Math.random() * AVATAR_GRADIENTS.length)];
    const newUserId = `user-${Date.now()}`;
    try {
      await setDoc(doc(db, 'users', newUserId), {
        name,
        type,
        avatarColor: randomGradient,
        ownerId: currentUser.uid
      });
      setSelectedUserId(newUserId); // auto-select newly created item
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

  // Action: Update user profile (like targetGoal or weeklyVolumeTarget)
  const handleUpdateUser = async (userId: string, updatedFields: Partial<User>) => {
    try {
      await updateDoc(doc(db, 'users', userId), updatedFields);
    } catch (err) {
      console.error('Error updating user profile in Firestore:', err);
    }
  };

  // Action: Add new group member (defaults to pending)
  const handleAddGroupMember = async (groupId: string, name: string, athleteId?: string) => {
    if (!currentUser) return;
    const newMemberId = `member-${Date.now()}`;
    try {
      await setDoc(doc(db, 'group_members', newMemberId), {
        groupId,
        name,
        athleteId: athleteId || '',
        status: 'pending',
        ownerId: currentUser.uid
      });
    } catch (err) {
      console.error('Error adding group member:', err);
    }
  };

  // Helper to aggregate stats from all clones of a group training and update the group's training
  const updateGroupTrainingStats = async (groupTrainingId: string) => {
    try {
      const q = query(collection(db, 'trainings'), where('groupTrainingId', '==', groupTrainingId));
      const snapshot = await getDocs(q);
      
      let totalPlannedKm = 0;
      let totalCompletedKm = 0;
      let doneCount = 0;
      let totalCount = 0;
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Training;
        if (data.userId !== data.parentGroupId) {
          totalPlannedKm += data.plannedKm || 0;
          totalCompletedKm += data.completedKm || 0;
          totalCount += 1;
          if (data.done) {
            doneCount += 1;
          }
        }
      });
      
      if (totalCount > 0) {
        await updateDoc(doc(db, 'trainings', groupTrainingId), {
          plannedKm: totalPlannedKm,
          completedKm: totalCompletedKm,
          done: doneCount === totalCount && totalCount > 0
        });
      } else {
        await updateDoc(doc(db, 'trainings', groupTrainingId), {
          completedKm: 0,
          done: false
        });
      }
    } catch (err) {
      console.error('Error updating group training stats:', err);
    }
  };

  // Action: Accept group member
  const handleAcceptGroupMember = async (memberId: string) => {
    try {
      await updateDoc(doc(db, 'group_members', memberId), {
        status: 'accepted'
      });

      const member = groupMembers.find(m => m.id === memberId);
      if (member && member.groupId && member.athleteId) {
        const groupTrainings = trainings.filter(t => t.userId === member.groupId);
        const copyPromises = groupTrainings.map(async (gt) => {
          const athleteHasIt = trainings.some(t => t.userId === member.athleteId && t.groupTrainingId === gt.id);
          if (athleteHasIt) return;

          const replicatedTrainingId = `t-${Date.now()}-${member.athleteId}-${gt.id}`;
          const baseline = gt.baselinePlannedKm || gt.plannedKm;
          
          await setDoc(doc(db, 'trainings', replicatedTrainingId), {
            userId: member.athleteId,
            week: gt.week,
            description: gt.description,
            dayOfWeek: gt.dayOfWeek,
            plannedKm: baseline,
            completedKm: 0,
            done: false,
            notes: gt.notes || '',
            ownerId: member.ownerId || currentUser?.uid,
            parentGroupId: member.groupId,
            groupTrainingId: gt.id,
            baselinePlannedKm: baseline
          });
          
          await updateGroupTrainingStats(gt.id);
        });
        await Promise.all(copyPromises);
      }
    } catch (err) {
      console.error('Error accepting group member:', err);
    }
  };

  // Action: Decline or delete group member
  const handleDeclineGroupMember = async (memberId: string) => {
    try {
      const member = groupMembers.find(m => m.id === memberId);
      await deleteDoc(doc(db, 'group_members', memberId));

      if (member && member.groupId && member.athleteId) {
        const copiedTrainings = trainings.filter(t => t.userId === member.athleteId && t.parentGroupId === member.groupId);
        await Promise.all(copiedTrainings.map(t => deleteDoc(doc(db, 'trainings', t.id))));

        const uniqueGroupTrainingIds = Array.from(new Set(copiedTrainings.map(t => t.groupTrainingId).filter(Boolean))) as string[];
        await Promise.all(uniqueGroupTrainingIds.map(gtId => updateGroupTrainingStats(gtId)));
      }
    } catch (err) {
      console.error('Error declining group member:', err);
    }
  };

  // Action: Add new training workout
  const handleAddTraining = async (newTrainingData: Omit<Training, 'id' | 'userId'>) => {
    if (!currentUser) return;
    const activeProfile = users.find(u => u.id === selectedUserId);
    if (activeProfile?.ownerId !== currentUser.uid) {
      console.error('Tentativa não autorizada de adicionar treino.');
      return;
    }
    const newTrainingId = `t-${Date.now()}`;
    const isGroup = activeProfile?.type === 'grupo';

    try {
      await setDoc(doc(db, 'trainings', newTrainingId), {
        userId: selectedUserId,
        week: newTrainingData.week,
        description: newTrainingData.description,
        dayOfWeek: newTrainingData.dayOfWeek,
        plannedKm: newTrainingData.plannedKm,
        completedKm: newTrainingData.completedKm,
        done: newTrainingData.done,
        notes: newTrainingData.notes || '',
        ownerId: currentUser.uid,
        ...(isGroup ? { 
          parentGroupId: selectedUserId, 
          groupTrainingId: newTrainingId,
          baselinePlannedKm: newTrainingData.plannedKm
        } : {})
      });

      if (isGroup) {
        const acceptedMembers = groupMembers.filter(m => m.groupId === selectedUserId && m.status === 'accepted');
        const replicationPromises = acceptedMembers.map((member) => {
          if (!member.athleteId) return Promise.resolve();
          const replicatedTrainingId = `t-${Date.now()}-${member.athleteId}`;
          return setDoc(doc(db, 'trainings', replicatedTrainingId), {
            userId: member.athleteId,
            week: newTrainingData.week,
            description: newTrainingData.description,
            dayOfWeek: newTrainingData.dayOfWeek,
            plannedKm: newTrainingData.plannedKm,
            completedKm: newTrainingData.completedKm,
            done: newTrainingData.done,
            notes: newTrainingData.notes || '',
            ownerId: member.ownerId || currentUser.uid,
            parentGroupId: selectedUserId,
            groupTrainingId: newTrainingId,
            baselinePlannedKm: newTrainingData.plannedKm
          });
        });
        await Promise.all(replicationPromises);
        await updateGroupTrainingStats(newTrainingId);
      }
    } catch (err) {
      console.error('Error adding training to Firestore:', err);
    }
  };

  // Action: Update training properties (supports single field or multiple fields via object)
  const handleUpdateTraining = async (id: string, fieldOrFields: keyof Training | Partial<Training>, value?: any) => {
    try {
      const trainingObj = trainings.find(t => t.id === id);
      if (!trainingObj) return;

      const profileOwner = users.find(u => u.id === trainingObj.userId)?.ownerId;
      if (profileOwner !== currentUser?.uid) {
        console.error('Tentativa não autorizada de editar treino.');
        return;
      }

      let updatedFields: Partial<Training> = {};
      if (typeof fieldOrFields === 'object') {
        updatedFields = { ...fieldOrFields };
      } else {
        updatedFields = { [fieldOrFields]: value };
      }

      await updateDoc(doc(db, 'trainings', id), updatedFields);

      if (trainingObj.groupTrainingId) {
        await updateGroupTrainingStats(trainingObj.groupTrainingId);
      }
    } catch (err) {
      console.error('Error updating training in Firestore:', err);
    }
  };

  // Action: Delete training
  const handleDeleteTraining = async (id: string) => {
    try {
      const trainingToDelete = trainings.find(t => t.id === id);
      if (!trainingToDelete) return;

      const profileOwner = users.find(u => u.id === trainingToDelete.userId)?.ownerId;
      if (profileOwner !== currentUser?.uid) {
        console.error('Tentativa não autorizada de remover treino.');
        return;
      }

      await deleteDoc(doc(db, 'trainings', id));

      if (trainingToDelete.userId && users.find(u => u.id === trainingToDelete.userId)?.type === 'grupo') {
        const replicatedTrainings = trainings.filter(t => t.groupTrainingId === id);
        await Promise.all(replicatedTrainings.map(t => deleteDoc(doc(db, 'trainings', t.id))));
      } else if (trainingToDelete.groupTrainingId) {
        await updateGroupTrainingStats(trainingToDelete.groupTrainingId);
      }
    } catch (err) {
      console.error('Error deleting training from Firestore:', err);
    }
  };


  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg text-white font-mono">
        <div className="text-center">
          <Activity size={32} className="text-brand-neon animate-pulse mx-auto mb-4" />
          <p className="text-xs uppercase tracking-widest opacity-60">Iniciando conexão...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onAuthSuccess={() => {}} />;
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg text-white font-mono">
        <div className="text-center">
          <Activity size={32} className="text-brand-neon animate-pulse mx-auto mb-4" />
          <p className="text-xs uppercase tracking-widest opacity-60">Sincronizando treinos com a nuvem...</p>
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

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 self-start md:self-center">
            {/* Core Tab Switches - High Contrast Mono Style */}
            <div className="flex bg-white/5 p-1 border border-white/10 flex-wrap">
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

            {/* User Account Info & Logout */}
            <div className="flex items-center gap-3 sm:border-l sm:border-white/10 sm:pl-4 h-9">
              <div className="text-left hidden md:block">
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-white">
                  {currentUser.displayName || 'Atleta'}
                </p>
                <p className="text-[8px] font-mono text-white/45 lowercase">
                  {currentUser.email}
                </p>
              </div>
              <button
                id="logout-btn"
                onClick={() => signOut(auth)}
                className="p-2.5 text-white/40 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 transition-all cursor-pointer"
                title="Sair da Conta"
              >
                <LogOut size={16} />
              </button>
            </div>
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
          onUpdateUser={handleUpdateUser}
          groupMembers={groupMembers}
          onAddGroupMember={handleAddGroupMember}
          onAcceptGroupMember={handleAcceptGroupMember}
          onDeclineGroupMember={handleDeclineGroupMember}
          currentUserId={currentUser?.uid}
        />


        {/* Dynamic Tab Switching Content rendering */}
        <div className="mt-4">
          {activeTab === 'planilha' && (
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
                isReadOnly={users.find(u => u.id === selectedUserId)?.ownerId !== currentUser?.uid}
              />
            </motion.div>
          )}
          {activeTab === 'graficos' && (
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
