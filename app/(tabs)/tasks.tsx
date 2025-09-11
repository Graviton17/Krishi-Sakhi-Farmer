import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useAuth } from "@/contexts/AuthContext";
import { FarmTask, farmTaskService, TaskStatus } from "@/lib";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function TasksScreen() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<FarmTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<FarmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "pending" | "in_progress" | "completed"
  >("all");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    due_date: "",
  });
  const [fabAnimation] = useState(new Animated.Value(0));

  const loadTasks = useCallback(async () => {
    try {
      if (!user?.id) return;

      console.log("Loading tasks for user:", user.id);
      const response = await farmTaskService.getByFarmer(user.id);

      if (response.success && response.data) {
        const tasksData = response.data;
        console.log("Tasks loaded successfully:", tasksData.length);
        setTasks(tasksData);
        filterTasks(tasksData, selectedFilter);
      } else {
        console.error("Failed to load tasks:", response.error);
        Alert.alert("Error", response.error?.message || "Failed to load tasks");
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
      Alert.alert("Error", "Failed to load tasks. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, selectedFilter]);

  const filterTasks = (tasksList: FarmTask[], filter: string) => {
    if (filter === "all") {
      setFilteredTasks(tasksList);
    } else {
      setFilteredTasks(tasksList.filter((task) => task.status === filter));
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadTasks();
    }
  }, [user?.id, loadTasks]);

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
  }, [fabAnimation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTasks();
  };

  const handleAddTask = async () => {
    try {
      if (!user?.id || !newTask.title.trim()) {
        Alert.alert("Error", "Please fill in the task title");
        return;
      }

      const taskData = {
        farmer_id: user.id,
        title: newTask.title.trim(),
        description: newTask.description.trim() || null,
        status: "pending" as TaskStatus,
        due_date: newTask.due_date || null,
      };

      console.log("Creating new task:", taskData);
      const response = await farmTaskService.create(taskData);

      if (response.success && response.data) {
        console.log("Task created successfully:", response.data);
        setTasks((prev) => [response.data!, ...prev]);
        setNewTask({
          title: "",
          description: "",
          priority: "medium",
          due_date: "",
        });
        setShowAddModal(false);
        Alert.alert("Success", "Task created successfully!");
      } else {
        console.error("Failed to create task:", response.error);
        Alert.alert(
          "Error",
          response.error?.message || "Failed to create task"
        );
      }
    } catch (error) {
      console.error("Error creating task:", error);
      Alert.alert("Error", "Failed to create task. Please try again.");
    }
  };

  const handleUpdateTaskStatus = async (
    taskId: string,
    newStatus: TaskStatus
  ) => {
    try {
      console.log("Updating task status:", taskId, newStatus);
      const response = await farmTaskService.updateStatus(taskId, newStatus);

      if (response.success && response.data) {
        console.log("Task status updated successfully");
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId ? { ...task, status: newStatus } : task
          )
        );
        Alert.alert("Success", "Task status updated successfully!");
      } else {
        console.error("Failed to update task status:", response.error);
        Alert.alert(
          "Error",
          response.error?.message || "Failed to update task status"
        );
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      Alert.alert("Error", "Failed to update task status. Please try again.");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            console.log("Deleting task:", taskId);
            const response = await farmTaskService.delete(taskId);

            if (response.success) {
              console.log("Task deleted successfully");
              setTasks((prev) => prev.filter((task) => task.id !== taskId));
              Alert.alert("Success", "Task deleted successfully!");
            } else {
              console.error("Failed to delete task:", response.error);
              Alert.alert(
                "Error",
                response.error?.message || "Failed to delete task"
              );
            }
          } catch (error) {
            console.error("Error deleting task:", error);
            Alert.alert("Error", "Failed to delete task. Please try again.");
          }
        },
      },
    ]);
  };

  const getTasksCountForFilter = (filter: string): number => {
    if (filter === "all") return tasks.length;
    return tasks.filter((task) => task.status === filter).length;
  };

  const FilterButton = ({
    filter,
    label,
  }: {
    filter: "all" | "pending" | "in_progress" | "completed";
    label: string;
  }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive,
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <ThemedText
        style={[
          styles.filterButtonText,
          selectedFilter === filter && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </ThemedText>
      <ThemedView
        style={[
          styles.filterCount,
          selectedFilter === filter && styles.filterCountActive,
        ]}
      >
        <ThemedText
          style={[
            styles.filterCountText,
            selectedFilter === filter && styles.filterCountTextActive,
          ]}
        >
          {getTasksCountForFilter(filter)}
        </ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );

  const TaskItem = ({ task }: { task: FarmTask }) => (
    <ThemedView style={styles.taskItem}>
      <View style={styles.taskHeader}>
        <ThemedText style={styles.taskTitle}>{task.title}</ThemedText>
        <View style={styles.taskActions}>
          <TouchableOpacity
            style={[
              styles.statusButton,
              { backgroundColor: getStatusColor(task.status) },
            ]}
            onPress={() => {
              const nextStatus = getNextStatus(task.status);
              if (nextStatus) {
                handleUpdateTaskStatus(task.id, nextStatus);
              }
            }}
          >
            <ThemedText style={styles.statusButtonText}>
              {task.status.replace("_", " ")}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteTask(task.id)}
          >
            <IconSymbol name="trash" size={16} color="#FF4444" />
          </TouchableOpacity>
        </View>
      </View>
      {task.description && (
        <ThemedText style={styles.taskDescription}>
          {task.description}
        </ThemedText>
      )}
      {task.due_date && (
        <ThemedText style={styles.taskDueDate}>
          Due: {new Date(task.due_date).toLocaleDateString()}
        </ThemedText>
      )}
      <ThemedText style={styles.taskCreated}>
        Created: {new Date(task.created_at).toLocaleDateString()}
      </ThemedText>
    </ThemedView>
  );

  const getStatusColor = (status: TaskStatus): string => {
    switch (status) {
      case "pending":
        return "#FF9800";
      case "in_progress":
        return "#2196F3";
      case "completed":
        return "#4CAF50";
      default:
        return "#757575";
    }
  };

  const getNextStatus = (currentStatus: TaskStatus): TaskStatus | null => {
    switch (currentStatus) {
      case "pending":
        return "in_progress";
      case "in_progress":
        return "completed";
      case "completed":
        return null;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <ThemedText style={styles.loadingText}>Loading tasks...</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText type="title">Farm Tasks</ThemedText>
        <ThemedText style={styles.subtitle}>
          Manage your daily farming activities
        </ThemedText>
      </ThemedView>

      {/* Filter Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        <FilterButton filter="all" label="All" />
        <FilterButton filter="pending" label="Pending" />
        <FilterButton filter="in_progress" label="In Progress" />
        <FilterButton filter="completed" label="Completed" />
      </ScrollView>

      {/* Tasks List */}
      <ScrollView
        style={styles.tasksList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => <TaskItem key={task.id} task={task} />)
        ) : (
          <ThemedView style={styles.emptyState}>
            <IconSymbol name="checklist" size={64} color="#CCC" />
            <ThemedText style={styles.emptyStateText}>
              {selectedFilter === "all"
                ? "No tasks yet"
                : `No ${selectedFilter.replace("_", " ")} tasks`}
            </ThemedText>
            <ThemedText style={styles.emptyStateSubtext}>
              {selectedFilter === "all"
                ? "Create your first task to get started"
                : "Try a different filter or create a new task"}
            </ThemedText>
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
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <ThemedText style={styles.cancelButton}>Cancel</ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.modalTitle}>Add New Task</ThemedText>
            <TouchableOpacity onPress={handleAddTask}>
              <ThemedText style={styles.saveButton}>Save</ThemedText>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Task Title *</ThemedText>
              <TextInput
                style={styles.textInput}
                value={newTask.title}
                onChangeText={(text) =>
                  setNewTask((prev) => ({ ...prev, title: text }))
                }
                placeholder="Enter task title"
                multiline={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Description</ThemedText>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newTask.description}
                onChangeText={(text) =>
                  setNewTask((prev) => ({ ...prev, description: text }))
                }
                placeholder="Enter task description"
                multiline={true}
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Due Date</ThemedText>
              <TextInput
                style={styles.textInput}
                value={newTask.due_date}
                onChangeText={(text) =>
                  setNewTask((prev) => ({ ...prev, due_date: text }))
                }
                placeholder="YYYY-MM-DD (optional)"
              />
            </View>
          </ScrollView>
        </ThemedView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.7,
  },
  filtersContainer: {
    paddingHorizontal: 20,
  },
  filtersContent: {
    gap: 8,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  filterButtonActive: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: "white",
  },
  filterCount: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  filterCountActive: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  filterCountText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  filterCountTextActive: {
    color: "white",
  },
  tasksList: {
    flex: 1,
    padding: 20,
  },
  taskItem: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "white",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    marginRight: 12,
  },
  taskActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "white",
    textTransform: "capitalize",
  },
  deleteButton: {
    padding: 4,
  },
  taskDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
    lineHeight: 20,
  },
  taskDueDate: {
    fontSize: 12,
    color: "#FF9800",
    fontWeight: "500",
    marginBottom: 4,
  },
  taskCreated: {
    fontSize: 12,
    opacity: 0.5,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 30,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  cancelButton: {
    fontSize: 16,
    color: "#FF4444",
  },
  saveButton: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4CAF50",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
});
