import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Button from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/IconSymbol";
import {
  Card,
  Column,
  Container,
  Row,
  ScreenContainer,
  Spacer,
} from "@/components/ui/Layout";
import {
  BodyText,
  Caption,
  Heading2,
  Heading3,
} from "@/components/ui/Typography";
import { Profile, profileService, useAuth } from "@/lib";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProfile, setEditProfile] = useState({
    full_name: "",
    phone_number: "",
    address: "",
    company_name: "",
    contact_email: "",
    location_gln: "",
    is_verified: false,
  });

  const loadProfile = useCallback(async () => {
    try {
      if (!user?.id) return;

      const response = await profileService.getAll({
        filters: [{ column: "id", operator: "eq", value: user.id }],
        pagination: { page: 1, limit: 1 },
      });

      if (response.success && response.data && response.data.length > 0) {
        const profileData = response.data[0];
        setProfile(profileData);
        setEditProfile({
          full_name: profileData.full_name || "",
          phone_number: profileData.phone_number || "",
          address: profileData.address || "",
          company_name: profileData.company_name || "",
          contact_email: profileData.contact_email || "",
          location_gln: profileData.location_gln || "",
          is_verified: profileData.is_verified || false,
        });
      } else {
        // Create a new profile if none exists
        const newProfile = {
          full_name: user.email?.split("@")[0] || "",
          phone_number: "",
          address: "",
          company_name: "",
          contact_email: user.email || "",
          location_gln: "",
          is_verified: false,
        };
        setEditProfile(newProfile);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      Alert.alert("Error", "Failed to load profile");
    } finally {
      setRefreshing(false);
    }
  }, [user?.id, user?.email]);

  useEffect(() => {
    loadProfile();
  }, [user, loadProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const handleSaveProfile = async () => {
    try {
      if (!user?.id) return;

      const profileData = {
        ...editProfile,
        id: user.id, // Use user.id as the profile ID
        role: "farmer" as const,
      };

      let response;
      if (profile) {
        // Update existing profile
        response = await profileService.update(profile.id, profileData);
      } else {
        // Create new profile
        response = await profileService.create(profileData);
      }

      if (response.success) {
        setShowEditModal(false);
        loadProfile();
        Alert.alert("Success", "Profile updated successfully");
      } else {
        Alert.alert("Error", "Failed to update profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: signOut,
      },
    ]);
  };

  const ProfileField = ({
    label,
    value,
    icon,
  }: {
    label: string;
    value: string;
    icon: string;
  }) => (
    <Column style={styles.profileField}>
      <Row style={styles.fieldHeader}>
        <IconSymbol name={icon as any} size={20} color="#4CAF50" />
        <BodyText style={styles.fieldLabel}>{label}</BodyText>
      </Row>
      <BodyText style={styles.fieldValue}>{value || "Not provided"}</BodyText>
      <Spacer size="xs" />
    </Column>
  );

  return (
    <ScreenContainer>
      <Container style={styles.header}>
        <Heading2>Profile</Heading2>
        <Button
          variant="primary"
          size="sm"
          onPress={() => setShowEditModal(true)}
          icon="pencil"
          title="Edit"
        />
      </Container>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Header */}
        <Card>
          <Column style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <IconSymbol name="person.fill" size={48} color="#4CAF50" />
            </View>
            <Spacer size="sm" />
            <Heading3 style={styles.profileName}>
              {profile?.full_name || user?.email?.split("@")[0] || "Farmer"}
            </Heading3>
            <BodyText style={styles.profileEmail}>{user?.email}</BodyText>
            {profile?.is_verified && (
              <Row style={styles.verifiedBadge}>
                <IconSymbol
                  name="checkmark.seal.fill"
                  size={16}
                  color="white"
                />
                <Caption style={styles.verifiedText}>Verified</Caption>
              </Row>
            )}
          </Column>
        </Card>

        <Spacer size="md" />

        {/* Profile Information */}
        <Card>
          <Heading3 style={styles.sectionTitle}>Personal Information</Heading3>
          <Spacer size="sm" />
          <ProfileField
            label="Full Name"
            value={profile?.full_name || ""}
            icon="person.fill"
          />
          <ProfileField
            label="Phone"
            value={profile?.phone_number || ""}
            icon="phone.fill"
          />
          <ProfileField
            label="Contact Email"
            value={profile?.contact_email || user?.email || ""}
            icon="envelope.fill"
          />
          <ProfileField
            label="Company Name"
            value={profile?.company_name || ""}
            icon="building.2.fill"
          />
        </Card>

        <Spacer size="md" />

        <Card>
          <Heading3 style={styles.sectionTitle}>Location</Heading3>
          <Spacer size="sm" />
          <ProfileField
            label="Address"
            value={profile?.address || ""}
            icon="location.fill"
          />
          <ProfileField
            label="Location GLN"
            value={profile?.location_gln || ""}
            icon="map.fill"
          />
          <ProfileField
            label="Role"
            value={profile?.role || "farmer"}
            icon="person.badge.plus"
          />
        </Card>

        <Spacer size="md" />

        {/* Account Actions */}
        <Card>
          <Heading3 style={styles.sectionTitle}>Account</Heading3>
          <Spacer size="sm" />
          <TouchableOpacity style={styles.actionItem} onPress={handleSignOut}>
            <IconSymbol
              name="rectangle.portrait.and.arrow.right"
              size={20}
              color="#F44336"
            />
            <ThemedText style={[styles.actionText, { color: "#F44336" }]}>
              Sign Out
            </ThemedText>
            <IconSymbol name="chevron.right" size={16} color="#757575" />
          </TouchableOpacity>
        </Card>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ThemedText type="subtitle">Edit Profile</ThemedText>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <IconSymbol name="xmark" size={24} color="#757575" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Full Name</ThemedText>
              <TextInput
                style={styles.textInput}
                value={editProfile.full_name}
                onChangeText={(text) =>
                  setEditProfile((prev) => ({ ...prev, full_name: text }))
                }
                placeholder="Enter your full name"
                placeholderTextColor="#757575"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Phone Number</ThemedText>
              <TextInput
                style={styles.textInput}
                value={editProfile.phone_number}
                onChangeText={(text) =>
                  setEditProfile((prev) => ({ ...prev, phone_number: text }))
                }
                placeholder="Enter your phone number"
                placeholderTextColor="#757575"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Contact Email</ThemedText>
              <TextInput
                style={styles.textInput}
                value={editProfile.contact_email}
                onChangeText={(text) =>
                  setEditProfile((prev) => ({ ...prev, contact_email: text }))
                }
                placeholder="Enter your contact email"
                placeholderTextColor="#757575"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Company Name</ThemedText>
              <TextInput
                style={styles.textInput}
                value={editProfile.company_name}
                onChangeText={(text) =>
                  setEditProfile((prev) => ({ ...prev, company_name: text }))
                }
                placeholder="Enter your company/farm name"
                placeholderTextColor="#757575"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Address</ThemedText>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={editProfile.address}
                onChangeText={(text) =>
                  setEditProfile((prev) => ({ ...prev, address: text }))
                }
                placeholder="Enter your address"
                placeholderTextColor="#757575"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Location GLN</ThemedText>
              <TextInput
                style={styles.textInput}
                value={editProfile.location_gln}
                onChangeText={(text) =>
                  setEditProfile((prev) => ({ ...prev, location_gln: text }))
                }
                placeholder="Enter your location GLN (optional)"
                placeholderTextColor="#757575"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.switchContainer}>
                <ThemedText style={styles.inputLabel}>
                  Verified Status
                </ThemedText>
                <Switch
                  value={editProfile.is_verified}
                  onValueChange={(value) =>
                    setEditProfile((prev) => ({ ...prev, is_verified: value }))
                  }
                  trackColor={{ false: "#767577", true: "#4CAF50" }}
                  thumbColor={editProfile.is_verified ? "#fff" : "#f4f3f4"}
                  disabled={true} // Users typically can't self-verify
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowEditModal(false)}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleSaveProfile}
            >
              <ThemedText style={styles.saveButtonText}>Save</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 24,
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  profileEmail: {
    opacity: 0.7,
    marginBottom: 12,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  verifiedText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  profileField: {
    marginBottom: 16,
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  fieldValue: {
    opacity: 0.8,
    lineHeight: 20,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    opacity: 0.7,
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalContent: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#fff",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "#333",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});
