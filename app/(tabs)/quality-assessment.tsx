import { QualityAssessmentScreen as QualityAssessmentComponent } from '@/components/farmer/QualityAssessment';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card, Container, ScreenContainer, Spacer } from '@/components/ui/Layout';
import { BodyText, Heading2 } from '@/components/ui/Typography';
import { useAuth } from '@/contexts/AuthContext';
import React from 'react';
import { StyleSheet } from 'react-native';

export default function QualityAssessmentScreen() {
  const { user } = useAuth();

  return (
    <ScreenContainer>
      <Container style={styles.header}>
        <Heading2>AI Quality Assessment</Heading2>
        <BodyText>Analyze and grade your produce quality</BodyText>
      </Container>

      <Container style={styles.content}>
        <Card>
          <Heading2>Quality Analysis</Heading2>
          <Spacer size="sm" />
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
        </Card>

        <Spacer size="md" />

        <Card>
          <Heading2>Assessment Features</Heading2>
          <Spacer size="sm" />
          <BodyText style={styles.featureText}>• Real-time quality grading (A-F scale)</BodyText>
          <BodyText style={styles.featureText}>• Defect detection and classification</BodyText>
          <BodyText style={styles.featureText}>• Confidence scoring for accuracy</BodyText>
          <BodyText style={styles.featureText}>• Blockchain integration for certificates</BodyText>
        </Card>

        <Spacer size="md" />

        <Card>
          <Heading2>How It Works</Heading2>
          <Spacer size="sm" />
          <BodyText>1. Capture or upload product images</BodyText>
          <BodyText>2. AI analyzes quality parameters</BodyText>
          <BodyText>3. Receive detailed assessment report</BodyText>
          <BodyText>4. Generate blockchain-verified certificates</BodyText>
        </Card>

        <Spacer size="md" />

        <Card>
          <Heading2>Benefits</Heading2>
          <Spacer size="sm" />
          <BodyText>• Fair pricing based on quality</BodyText>
          <BodyText>• Build buyer trust with certificates</BodyText>
          <BodyText>• Track quality trends over time</BodyText>
          <BodyText>• Meet export standards</BodyText>
        </Card>
      </Container>
    </ScreenContainer>
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
