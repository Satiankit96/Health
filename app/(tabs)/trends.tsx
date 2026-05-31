import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/theme';

export default function TrendsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
  },
  text: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: Colors.inkSoft,
  },
});
