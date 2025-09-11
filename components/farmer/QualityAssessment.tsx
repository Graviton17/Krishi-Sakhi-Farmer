import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../ThemedText';

export function QualityAssessmentScreen() {
  const [loading, setLoading] = useState(false);
  const [quality, setQuality] = useState<string | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0].uri) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const analyzeProduce = async () => {
    try {
      setLoading(true);
      // Simulate analysis delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setQuality('A');
      setPrice(300);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Image Preview */}
      {image ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.imageContainer} 
          onPress={pickImage}
        >
          <ThemedText style={styles.uploadText}>
            Tap to upload an image
          </ThemedText>
        </TouchableOpacity>
      )}

      <TouchableOpacity 
        style={[styles.button, styles.analyzeButton]}
        onPress={analyzeProduce}
        disabled={loading || !image}
      >
        <ThemedText style={styles.buttonText}>
          {image ? 'Analyze Quality' : 'Upload an image first'}
        </ThemedText>
      </TouchableOpacity>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <ThemedText style={styles.loadingText}>
            Analyzing produce...
          </ThemedText>
        </View>
      )}

      {quality && price && (
        <View style={styles.resultContainer}>
          <View style={styles.gradeContainer}>
            <ThemedText style={styles.gradeLabel}>Quality Grade</ThemedText>
            <View style={[styles.gradeBadge, { backgroundColor: '#4CAF50' }]}>
              <ThemedText style={styles.gradeText}>{quality}</ThemedText>
            </View>
            <View style={styles.priceContainer}>
              <ThemedText style={styles.priceLabel}>
                Predicted Price
              </ThemedText>
              <ThemedText style={styles.priceValue}>₹{price}</ThemedText>
              <ThemedText style={styles.priceNote}>per kg</ThemedText>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 20,
    padding: 16,
  },
  imageContainer: {
    aspectRatio: 4/3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  uploadText: {
    fontSize: 16,
    opacity: 0.6,
  },
  button: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  analyzeButton: {
    backgroundColor: '#6200EA',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
  },
  loadingText: {
    opacity: 0.7,
    fontSize: 16,
  },
  resultContainer: {
    gap: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
  },
  gradeContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  gradeLabel: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  gradeBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  gradeText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  priceContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    gap: 8,
  },
  priceLabel: {
    fontSize: 16,
    opacity: 0.8,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  priceNote: {
    fontSize: 14,
    opacity: 0.6,
  },
});