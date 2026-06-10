import { View, Text, StyleSheet } from 'react-native';

export default function Home() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Moodly</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAFA' },
  title: { fontSize: 24, fontWeight: '600', color: '#222' },
});