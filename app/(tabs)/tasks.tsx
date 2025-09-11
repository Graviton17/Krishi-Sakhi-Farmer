import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  Alert, 
  TouchableOpacity, 
  Modal,
  TextInput,
  View,
  Animated,
  Dimensions
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/lib';
import { 
  farmTaskService,
  FarmTask,
  TaskStatus
} from '@/lib';

const { width } = Dimensions.get('window');

export default function TasksScreen() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<FarmTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<FarmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    due_date: '',
  });
  const [fabAnimation] = useState(new Animated.Value(0));

  const loadTasks = async () => {
    try {
      if (!user?.id) return;

      const response = await farmTaskService.getByFarmer(user.id);

      if (response.success) {
        const tasksData = response.data || [];
        setTasks(tasksData);
        filterTasks(tasksData, selectedFilter);
      } else {
        Alert.alert('Error', 'Failed to load tasks');
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterTasks = (tasksList: FarmTask[], filter: string) => {
    if (filter === 'all') {
      setFilteredTasks(tasksList);
    } else {
      setFilteredTasks(tasksList.filter(task => task.status === filter));
    }
  };

  useEffect(() => {
    loadTasks();
  }, [user]);

  useEffect(() => {
    filterTasks(tasks, selectedFilter);
  }, [selectedFilter, tasks]);

  useEffect(() => {
    Animated.spring(fabAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadTasks();
  };

  const handleAddTask = async () => {
    try {
      if (!user?.id || !newTask.title.trim()) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const taskData = {
        ...newTask,
        farmer_id: user.id,
        status: 'pending' as TaskStatus,
        due_date: newTask.due_date || null,
      };

      const response = await farmTaskService.create(taskData);

      if (response.success) {
        setNewTask({ title: '', description: '', priority: 'medium', due_date: '' });
        setShowAddModal(false);
        loadTasks();
        Alert.alert('Success', 'Task created successfully');
      } else {
        Alert.alert('Error', 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('Error', 'Failed to create task');
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const response = await farmTaskService.update(taskId, { status: newStatus });

      if (response.success) {
        loadTasks();
        Alert.alert('Success', 'Task status updated');
      } else {
        Alert.alert('Error', 'Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task status');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      Alert.alert(
        'Delete Task',
        'Are you sure you want to delete this task?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              const response = await farmTaskService.delete(taskId);
              if (response.success) {
                loadTasks();
                Alert.alert('Success', 'Task deleted successfully');
              } else {
                Alert.alert('Error', 'Failed to delete task');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error deleting task:', error);
      Alert.alert('Error', 'Failed to delete task');
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'in_progress': return '#2196F3';
      case 'pending': return '#FF9800';
      default: return '#757575';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#757575';
    }
  };

  const FilterButton = ({ filter, label, count }: { filter: string; label: string; count: number }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(filter as any)}
    >
      <ThemedText style={[
        styles.filterButtonText,
        selectedFilter === filter && styles.filterButtonTextActive
      ]}>
        {label}
      </ThemedText>
      <View style={[
        styles.filterCount,
        selectedFilter === filter && styles.filterCountActive
      ]}>
        <ThemedText style={[
          styles.filterCountText,
          selectedFilter === filter && styles.filterCountTextActive
        ]}>
          {count}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  const TaskItem = ({ task }: { task: FarmTask }) => (
    <TouchableOpacity style={styles.taskItem} activeOpacity={0.7}>
      <View style={styles.taskContent}>
        <View style={styles.taskHeader}>
          <View style={styles.taskTitleRow}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(task.status) }]} />
            <ThemedText style={styles.taskTitle} numberOfLines={2}>{task.title}</ThemedText>
          </View>
          <View style={styles.taskActions}>
            {task.status !== 'completed' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                onPress={() => handleUpdateTaskStatus(task.id, 'completed')}
              >
                <IconSymbol name="checkmark" size={16} color="white" />
              </TouchableOpacity>
            )}
            {task.status === 'pending' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
                onPress={() => handleUpdateTaskStatus(task.id, 'in_progress')}
              >
                <IconSymbol name="play.fill" size={16} color="white" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#F44336' }]}
              onPress={() => handleDeleteTask(task.id)}
            >
              <IconSymbol name="trash" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        
        {task.description && (
          <ThemedText style={styles.taskDescription} numberOfLines={3}>
            {task.description}
          </ThemedText>
        )}
        
        <View style={styles.taskFooter}>
          <View style={styles.taskMeta}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
              <ThemedText style={styles.statusText}>{task.status.replace('_', ' ')}</ThemedText>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor('medium') }]}>
              <ThemedText style={styles.priorityText}>medium</ThemedText>
            </View>
          </View>
          {task.due_date && (
            <View style={styles.dueDateContainer}>
              <IconSymbol name="calendar" size={14} color="#757575" />
              <ThemedText style={styles.dueDate}>
                {new Date(task.due_date).toLocaleDateString()}
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <ThemedText type="title" style={styles.headerTitle}>Farm Tasks</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            {filteredTasks.length} of {tasks.length} tasks
          </ThemedText>
        </View>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowAddModal(true)}
        >
          <IconSymbol name="plus" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <FilterButton 
          filter="all" 
          label="All" 
          count={tasks.length} 
        />
        <FilterButton 
          filter="pending" 
          label="Pending" 
          count={tasks.filter(t => t.status === 'pending').length} 
        />
        <FilterButton 
          filter="in_progress" 
          label="In Progress" 
          count={tasks.filter(t => t.status === 'in_progress').length} 
        />
        <FilterButton 
          filter="completed" 
          label="Completed" 
          count={tasks.filter(t => t.status === 'completed').length} 
        />
      </ScrollView>

      {/* Tasks List */}
      <ScrollView 
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredTasks.length > 0 ? (
          <View style={styles.tasksList}>
            {filteredTasks.map((task) => <TaskItem key={task.id} task={task} />)}
          </View>
        ) : (
          <ThemedView style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <IconSymbol name="checklist" size={64} color="#4CAF50" />
            </View>
            <ThemedText style={styles.emptyText}>
              {selectedFilter === 'all' ? 'No tasks yet' : `No ${selectedFilter.replace('_', ' ')} tasks`}
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              {selectedFilter === 'all' 
                ? 'Add your first farm task to get started' 
                : `No tasks with ${selectedFilter.replace('_', ' ')} status`
              }
            </ThemedText>
            {selectedFilter === 'all' && (
              <TouchableOpacity
                style={styles.emptyActionButton}
                onPress={() => setShowAddModal(true)}
              >
                <IconSymbol name="plus" size={20} color="white" />
                <ThemedText style={styles.emptyActionText}>Add Task</ThemedText>
              </TouchableOpacity>
            )}
          </ThemedView>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <Animated.View 
        style={[
          styles.fab,
          {
            transform: [
              {
                scale: fabAnimation,
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
        >
          <IconSymbol name="plus" size={24} color="white" />
        </TouchableOpacity>
      </Animated.View>

      {/* Add Task Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ThemedText type="subtitle">Add New Task</ThemedText>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <IconSymbol name="xmark" size={24} color="#757575" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Title *</ThemedText>
              <TextInput
                style={styles.textInput}
                value={newTask.title}
                onChangeText={(text) => setNewTask(prev => ({ ...prev, title: text }))}
                placeholder="Enter task title"
                placeholderTextColor="#757575"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Description</ThemedText>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newTask.description}
                onChangeText={(text) => setNewTask(prev => ({ ...prev, description: text }))}
                placeholder="Enter task description"
                placeholderTextColor="#757575"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Priority</ThemedText>
              <View style={styles.priorityButtons}>
                {['low', 'medium', 'high'].map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityButton,
                      newTask.priority === priority && styles.priorityButtonActive
                    ]}
                    onPress={() => setNewTask(prev => ({ ...prev, priority: priority as any }))}
                  >
                    <ThemedText style={[
                      styles.priorityButtonText,
                      newTask.priority === priority && styles.priorityButtonTextActive
                    ]}>
                      {priority}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Due Date</ThemedText>
              <TextInput
                style={styles.textInput}
                value={newTask.due_date}
                onChangeText={(text) => setNewTask(prev => ({ ...prev, due_date: text }))}
                placeholder="YYYY-MM-DD (optional)"
                placeholderTextColor="#757575"
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowAddModal(false)}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleAddTask}
            >
              <ThemedText style={styles.saveButtonText}>Add Task</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  headerButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  filterContainer: {
    maxHeight: 60,
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
  filterButtonTextActive: {
    color: 'white',
    opacity: 1,
  },
  filterCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  filterCountActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  filterCountTextActive: {
    color: 'white',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tasksList: {
    paddingBottom: 100,
  },
  taskItem: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  taskContent: {
    padding: 20,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: 12,
  },
  statusIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
    marginTop: 2,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    borderRadius: 8,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  taskDescription: {
    opacity: 0.7,
    marginBottom: 16,
    lineHeight: 20,
    fontSize: 14,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  priorityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  emptyActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    zIndex: 1000,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  modalContent: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  priorityButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  priorityButtonTextActive: {
    color: 'white',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 24,
    paddingBottom: 20,
  },
  modalButton: {
    flex: 1,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
