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
  Switch
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/lib';
import { 
  profileService,
  Profile,
  UserRole
} from '@/lib';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProfile, setEditProfile] = useState({
    full_name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    farm_size: '',
    farming_experience: '',
    bio: '',
    is_verified: false,
  });

  const loadProfile = async () => {
    try {
      if (!user?.id) return;

      const response = await profileService.getAll({
        filters: [{ column: 'user_id', operator: 'eq', value: user.id }],
        pagination: { limit: 1 }
      });

      if (response.success && response.data && response.data.length > 0) {
        const profileData = response.data[0];
        setProfile(profileData);
        setEditProfile({
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
          address: profileData.address || '',
          city: profileData.city || '',
          state: profileData.state || '',
          pincode: profileData.pincode || '',
          farm_size: profileData.farm_size?.toString() || '',
          farming_experience: profileData.farming_experience?.toString() || '',
          bio: profileData.bio || '',
          is_verified: profileData.is_verified || false,
        });
      } else {
        // Create a new profile if none exists
        const newProfile = {
          user_id: user.id,
          full_name: user.email?.split('@')[0] || '',
          phone: '',
          address: '',
          city: '',
          state: '',
          pincode: '',
          farm_size: 0,
          farming_experience: 0,
          bio: '',
          is_verified: false,
        };
        setEditProfile(newProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const handleSaveProfile = async () => {
    try {
      if (!user?.id) return;

      const profileData = {
        ...editProfile,
        user_id: user.id,
        farm_size: parseFloat(editProfile.farm_size) || 0,
        farming_experience: parseInt(editProfile.farming_experience) || 0,
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
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: signOut
        }
      ]
    );
  };

  const ProfileField = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
    <View style={styles.profileField}>
      <View style={styles.fieldHeader}>
        <IconSymbol name={icon} size={20} color="#4CAF50" />
        <ThemedText style={styles.fieldLabel}>{label}</ThemedText>
      </View>
      <ThemedText style={styles.fieldValue}>{value || 'Not provided'}</ThemedText>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Profile</ThemedText>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setShowEditModal(true)}
        >
          <IconSymbol name="pencil" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Profile Header */}
        <ThemedView style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <IconSymbol name="person.fill" size={48} color="#4CAF50" />
          </View>
          <ThemedText style={styles.profileName}>
            {profile?.full_name || user?.email?.split('@')[0] || 'Farmer'}
          </ThemedText>
          <ThemedText style={styles.profileEmail}>{user?.email}</ThemedText>
          {profile?.is_verified && (
            <View style={styles.verifiedBadge}>
              <IconSymbol name="checkmark.seal.fill" size={16} color="white" />
              <ThemedText style={styles.verifiedText}>Verified</ThemedText>
            </View>
          )}
        </ThemedView>

        {/* Profile Information */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Personal Information</ThemedText>
          <ProfileField 
            label="Full Name" 
            value={profile?.full_name || ''} 
            icon="person.fill" 
          />
          <ProfileField 
            label="Phone" 
            value={profile?.phone || ''} 
            icon="phone.fill" 
          />
          <ProfileField 
            label="Email" 
            value={user?.email || ''} 
            icon="envelope.fill" 
          />
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Location</ThemedText>
          <ProfileField 
            label="Address" 
            value={profile?.address || ''} 
            icon="location.fill" 
          />
          <ProfileField 
            label="City" 
            value={profile?.city || ''} 
            icon="building.2.fill" 
          />
          <ProfileField 
            label="State" 
            value={profile?.state || ''} 
            icon="map.fill" 
          />
          <ProfileField 
            label="Pincode" 
            value={profile?.pincode || ''} 
            icon="number" 
          />
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Farm Information</ThemedText>
          <ProfileField 
            label="Farm Size" 
            value={profile?.farm_size ? `${profile.farm_size} acres` : ''} 
            icon="leaf.fill" 
          />
          <ProfileField 
            label="Farming Experience" 
            value={profile?.farming_experience ? `${profile.farming_experience} years` : ''} 
            icon="calendar" 
          />
          {profile?.bio && (
            <View style={styles.profileField}>
              <View style={styles.fieldHeader}>
                <IconSymbol name="text.alignleft" size={20} color="#4CAF50" />
                <ThemedText style={styles.fieldLabel}>Bio</ThemedText>
              </View>
              <ThemedText style={styles.fieldValue}>{profile.bio}</ThemedText>
            </View>
          )}
        </ThemedView>

        {/* Account Actions */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Account</ThemedText>
          <TouchableOpacity style={styles.actionItem} onPress={handleSignOut}>
            <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color="#F44336" />
            <ThemedText style={[styles.actionText, { color: '#F44336' }]}>Sign Out</ThemedText>
            <IconSymbol name="chevron.right" size={16} color="#757575" />
          </TouchableOpacity>
        </ThemedView>
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
                onChangeText={(text) => setEditProfile(prev => ({ ...prev, full_name: text }))}
                placeholder="Enter your full name"
                placeholderTextColor="#757575"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Phone</ThemedText>
              <TextInput
                style={styles.textInput}
                value={editProfile.phone}
                onChangeText={(text) => setEditProfile(prev => ({ ...prev, phone: text }))}
                placeholder="Enter your phone number"
                placeholderTextColor="#757575"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Address</ThemedText>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={editProfile.address}
                onChangeText={(text) => setEditProfile(prev => ({ ...prev, address: text }))}
                placeholder="Enter your address"
                placeholderTextColor="#757575"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>City</ThemedText>
              <TextInput
                style={styles.textInput}
                value={editProfile.city}
                onChangeText={(text) => setEditProfile(prev => ({ ...prev, city: text }))}
                placeholder="Enter your city"
                placeholderTextColor="#757575"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>State</ThemedText>
              <TextInput
                style={styles.textInput}
                value={editProfile.state}
                onChangeText={(text) => setEditProfile(prev => ({ ...prev, state: text }))}
                placeholder="Enter your state"
                placeholderTextColor="#757575"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Pincode</ThemedText>
              <TextInput
                style={styles.textInput}
                value={editProfile.pincode}
                onChangeText={(text) => setEditProfile(prev => ({ ...prev, pincode: text }))}
                placeholder="Enter your pincode"
                placeholderTextColor="#757575"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Farm Size (acres)</ThemedText>
              <TextInput
                style={styles.textInput}
                value={editProfile.farm_size}
                onChangeText={(text) => setEditProfile(prev => ({ ...prev, farm_size: text }))}
                placeholder="Enter farm size in acres"
                placeholderTextColor="#757575"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Farming Experience (years)</ThemedText>
              <TextInput
                style={styles.textInput}
                value={editProfile.farming_experience}
                onChangeText={(text) => setEditProfile(prev => ({ ...prev, farming_experience: text }))}
                placeholder="Enter years of farming experience"
                placeholderTextColor="#757575"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Bio</ThemedText>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={editProfile.bio}
                onChangeText={(text) => setEditProfile(prev => ({ ...prev, bio: text }))}
                placeholder="Tell us about yourself and your farming practices"
                placeholderTextColor="#757575"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.switchContainer}>
                <ThemedText style={styles.inputLabel}>Verified Farmer</ThemedText>
                <Switch
                  value={editProfile.is_verified}
                  onValueChange={(value) => setEditProfile(prev => ({ ...prev, is_verified: value }))}
                  trackColor={{ false: '#767577', true: '#4CAF50' }}
                  thumbColor={editProfile.is_verified ? '#fff' : '#f4f3f4'}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    opacity: 0.7,
    marginBottom: 12,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  verifiedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  profileField: {
    marginBottom: 16,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  fieldValue: {
    opacity: 0.8,
    lineHeight: 20,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    opacity: 0.7,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#333',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
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
