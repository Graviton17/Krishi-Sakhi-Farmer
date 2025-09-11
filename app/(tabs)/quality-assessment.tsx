import { QualityAssessmentScreen as QualityAssessmentComponent } from '@/components/farmer/QualityAssessment';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import SectionCard from '@/components/ui/SectionCard';
import { useAuth } from '@/contexts/AuthContext';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

export default function QualityAssessmentScreen() {
  const { user } = useAuth();

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">AI Quality Assessment</ThemedText>
          <ThemedText>Analyze and grade your produce quality</ThemedText>
        </ThemedView>

        <SectionCard title="Quality Analysis">
          <QualityAssessmentComponent />
          {!user && (
            <ThemedView style={styles.loginPrompt}>
              <ThemedText style={styles.loginPromptText}>
                👋 Log in to unlock additional features:
              </ThemedText>
              <ThemedText style={styles.bulletPoint}>• Save analysis history</ThemedText>
              <ThemedText style={styles.bulletPoint}>• Generate quality certificates</ThemedText>
              <ThemedText style={styles.bulletPoint}>• Track quality trends</ThemedText>
            </ThemedView>
          )}
        </SectionCard>

        <SectionCard title="Assessment Features">
          <ThemedText style={styles.featureText}>• Real-time quality grading (A-F scale)</ThemedText>
          <ThemedText style={styles.featureText}>• Defect detection and classification</ThemedText>
          <ThemedText style={styles.featureText}>• Confidence scoring for accuracy</ThemedText>
          <ThemedText style={styles.featureText}>• Blockchain integration for certificates</ThemedText>
        </SectionCard>

        <SectionCard title="How It Works">
          <ThemedText>1. Capture or upload product images</ThemedText>
          <ThemedText>2. AI analyzes quality parameters</ThemedText>
          <ThemedText>3. Receive detailed assessment report</ThemedText>
          <ThemedText>4. Generate blockchain-verified certificates</ThemedText>
        </SectionCard>

        <SectionCard title="Benefits">
          <ThemedText>• Fair pricing based on quality</ThemedText>
          <ThemedText>• Build buyer trust with certificates</ThemedText>
          <ThemedText>• Track quality trends over time</ThemedText>
          <ThemedText>• Meet export standards</ThemedText>
        </SectionCard>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  header: {
    gap: 8,
    marginBottom: 12,
  },
  loginPrompt: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    gap: 8,
  },
  loginPromptText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  bulletPoint: {
    fontSize: 15,
    opacity: 0.8,
    paddingLeft: 4,
  },
  featureText: {
    fontSize: 15,
    lineHeight: 24,
    opacity: 0.9,
  },
});
