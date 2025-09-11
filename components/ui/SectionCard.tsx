import React, { PropsWithChildren } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';

type SectionCardProps = PropsWithChildren<{
  title?: string;
  style?: ViewStyle;
}>;

export default function SectionCard({ title, style, children }: SectionCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <ThemedView
      lightColor="#ffffff"
      darkColor="#1c1f22"
      style={[
        styles.card,
        {
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        },
        style,
      ]}
    >
      {title ? <ThemedText type="subtitle" style={styles.title}>{title}</ThemedText> : null}
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    // subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    marginBottom: 6,
  },
}); 