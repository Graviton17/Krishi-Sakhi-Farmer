import { useAuth } from "@/contexts/AuthContext";
import { farmTaskService } from "@/services/entities";
import type { FarmTask, TaskStatus } from "@/types/supabase";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function FarmTaskManager() {
  const { user } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [tasks, setTasks] = useState<FarmTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    due_date: "",
  });

  const fetchTasks = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const response = await farmTaskService.getByFarmer(user.id);
      if (response.error) {
        Alert.alert("Error", response.error.message);
        return;
      }
      setTasks(response.data || []);
    } catch {
      Alert.alert("Error", "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async () => {
    if (!user?.id || !newTask.title.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    try {
      // Convert date format if provided
      let formattedDate = null;
      if (newTask.due_date) {
        const dateStr = newTask.due_date.trim();
        let parsedDate: Date | null = null;

        // Try to parse various date formats
        if (dateStr.includes(",")) {
          // Handle MM,DD,YYYY format
          const parts = dateStr.split(",");
          if (parts.length === 3) {
            const [month, day, year] = parts.map((p) => p.trim());
            parsedDate = new Date(
              parseInt(year),
              parseInt(month) - 1,
              parseInt(day)
            );
          }
        } else if (dateStr.includes("/")) {
          // Handle MM/DD/YYYY format
          const parts = dateStr.split("/");
          if (parts.length === 3) {
            const [month, day, year] = parts.map((p) => p.trim());
            parsedDate = new Date(
              parseInt(year),
              parseInt(month) - 1,
              parseInt(day)
            );
          }
        } else if (dateStr.includes("-")) {
          // Handle YYYY-MM-DD or MM-DD-YYYY format
          const parts = dateStr.split("-");
          if (parts.length === 3) {
            if (parts[0].length === 4) {
              // YYYY-MM-DD - use as is
              parsedDate = new Date(dateStr);
            } else {
              // MM-DD-YYYY
              const [month, day, year] = parts.map((p) => p.trim());
              parsedDate = new Date(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day)
              );
            }
          }
        }

        // Convert to YYYY-MM-DD format if parsing was successful
        if (parsedDate && !isNaN(parsedDate.getTime())) {
          formattedDate = parsedDate.toISOString().split("T")[0];
        } else {
          Alert.alert(
            "Error",
            "Invalid date format. Please use YYYY-MM-DD, MM/DD/YYYY, or MM-DD-YYYY format"
          );
          return;
        }
      }

      const response = await farmTaskService.create({
        farmer_id: user.id,
        title: newTask.title.trim(),
        description: newTask.description.trim() || null,
        due_date: formattedDate,
        status: "pending" as TaskStatus,
      } as FarmTask);

      if (response.error) {
        Alert.alert("Error", response.error.message);
        return;
      }

      Alert.alert("Success", "Task created successfully");
      setNewTask({ title: "", description: "", due_date: "" });
      setModalVisible(false);
      fetchTasks();
    } catch {
      Alert.alert("Error", "Failed to create task");
    }
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      const response = await farmTaskService.updateStatus(taskId, status);

      if (response.error) {
        Alert.alert("Error", response.error.message);
        return;
      }

      Alert.alert("Success", "Task status updated successfully");
      fetchTasks();
    } catch {
      Alert.alert("Error", "Failed to update task status");
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "pending":
        return "bg-warning-100 text-warning-700";
      case "in_progress":
        return "bg-primary-100 text-primary-700";
      case "completed":
        return "bg-success-100 text-success-700";
      default:
        return "bg-neutral-100 text-neutral-700";
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case "pending":
        return "⏳";
      case "in_progress":
        return "🔄";
      case "completed":
        return "✅";
      default:
        return "📋";
    }
  };

  const isPastDue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const renderTaskItem = ({ item }: { item: FarmTask }) => (
    <View className="bg-white rounded-xl p-4 mb-4 shadow-soft border border-neutral-200">
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-neutral-900 mb-1">
            {item.title}
          </Text>
          {item.description && (
            <Text className="text-sm text-neutral-600 mb-2">
              {item.description}
            </Text>
          )}
        </View>

        <View
          className={`px-3 py-1 rounded-full ${getStatusColor(item.status)}`}
        >
          <Text className="text-xs font-medium">
            {getStatusIcon(item.status)} {item.status.replace("_", " ")}
          </Text>
        </View>
      </View>

      {item.due_date && (
        <View className="flex-row items-center mb-3">
          <Text
            className={`text-sm ${
              isPastDue(item.due_date)
                ? "text-error-600 font-medium"
                : "text-neutral-600"
            }`}
          >
            Due: {new Date(item.due_date).toLocaleDateString()}
          </Text>
          {isPastDue(item.due_date) && item.status !== "completed" && (
            <View className="ml-2 bg-error-100 px-2 py-1 rounded">
              <Text className="text-error-700 text-xs font-medium">
                Overdue
              </Text>
            </View>
          )}
        </View>
      )}

      <View className="flex-row space-x-2">
        {item.status === "pending" && (
          <TouchableOpacity
            className="bg-primary-500 px-4 py-2 rounded-lg active:bg-primary-600"
            onPress={() => handleStatusChange(item.id, "in_progress")}
          >
            <Text className="text-white text-sm font-medium">Start Task</Text>
          </TouchableOpacity>
        )}

        {item.status === "in_progress" && (
          <TouchableOpacity
            className="bg-success-500 px-4 py-2 rounded-lg active:bg-success-600"
            onPress={() => handleStatusChange(item.id, "completed")}
          >
            <Text className="text-white text-sm font-medium">
              Mark Complete
            </Text>
          </TouchableOpacity>
        )}

        {item.status === "completed" && (
          <TouchableOpacity
            className="bg-neutral-200 px-4 py-2 rounded-lg active:bg-neutral-300"
            onPress={() => handleStatusChange(item.id, "in_progress")}
          >
            <Text className="text-neutral-700 text-sm font-medium">Reopen</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-neutral-50">
        <Text className="text-lg font-medium text-neutral-700">
          Loading tasks...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-50">
      <View className="bg-white pt-12 pb-6 px-6 shadow-sm">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-neutral-900 mb-2">
              Farm Tasks 📋
            </Text>
            <Text className="text-neutral-600">
              Manage your daily farming activities
            </Text>
          </View>

          <TouchableOpacity
            className="bg-primary-500 p-3 rounded-full active:bg-primary-600"
            onPress={() => setModalVisible(true)}
          >
            <Text className="text-white text-2xl">+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={tasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={fetchTasks}
        ListEmptyComponent={
          <View className="bg-white rounded-xl p-8 items-center">
            <Text className="text-lg font-medium text-neutral-700 text-center mb-2">
              No tasks yet
            </Text>
            <Text className="text-neutral-500 text-center mb-4">
              Add your first farming task to get started!
            </Text>
            <TouchableOpacity
              className="bg-primary-500 px-6 py-3 rounded-lg active:bg-primary-600"
              onPress={() => setModalVisible(true)}
            >
              <Text className="text-white font-semibold">Add Task</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Add Task Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-2xl p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold text-neutral-900">
                Add New Task
              </Text>
              <TouchableOpacity
                className="p-2"
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-neutral-500 text-lg">✕</Text>
              </TouchableOpacity>
            </View>

            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-neutral-700 mb-2">
                  Task Title
                </Text>
                <TextInput
                  className="border border-neutral-300 px-4 py-3 rounded-lg text-base"
                  placeholder="What needs to be done?"
                  value={newTask.title}
                  onChangeText={(text) =>
                    setNewTask((prev) => ({ ...prev, title: text }))
                  }
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-neutral-700 mb-2">
                  Description (Optional)
                </Text>
                <TextInput
                  className="border border-neutral-300 px-4 py-3 rounded-lg text-base h-20"
                  placeholder="Additional details..."
                  value={newTask.description}
                  onChangeText={(text) =>
                    setNewTask((prev) => ({ ...prev, description: text }))
                  }
                  multiline
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-neutral-700 mb-2">
                  Due Date (Optional)
                </Text>
                <TextInput
                  className="border border-neutral-300 px-4 py-3 rounded-lg text-base"
                  placeholder="YYYY-MM-DD, MM/DD/YYYY, or MM-DD-YYYY"
                  value={newTask.due_date}
                  onChangeText={(text) =>
                    setNewTask((prev) => ({ ...prev, due_date: text }))
                  }
                />
              </View>
            </View>

            <View className="flex-row space-x-3 mt-6">
              <TouchableOpacity
                className="flex-1 bg-neutral-200 py-3 rounded-lg active:bg-neutral-300"
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-neutral-700 font-semibold text-center">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-primary-500 py-3 rounded-lg active:bg-primary-600"
                onPress={handleCreateTask}
              >
                <Text className="text-white font-semibold text-center">
                  Add Task
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
