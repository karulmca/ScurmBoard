import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme';

// Screens
import BoardsScreen    from '../screens/BoardsScreen';
import BacklogScreen   from '../screens/BacklogScreen';
import WorkItemsScreen from '../screens/WorkItemsScreen';
import ReportsScreen   from '../screens/ReportsScreen';

const Tab = createBottomTabNavigator();

// Simple icon-as-text labels (no icon library dependency at runtime)
const TAB_ICONS = {
  Boards:     '⬡',
  Backlog:    '☰',
  'Work Items': '☑',
  Reports:    '📊',
};

function TabIcon({ name, focused }) {
  return (
    <View style={styles.iconWrap}>
      <Text style={[styles.iconText, focused && styles.iconFocused]}>
        {TAB_ICONS[name]}
      </Text>
    </View>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerStyle:        { backgroundColor: COLORS.surface, borderBottomColor: COLORS.border, borderBottomWidth: 1 },
          headerTintColor:    COLORS.textPrimary,
          headerTitleStyle:   { fontWeight: TYPOGRAPHY.weightSemibold, fontSize: TYPOGRAPHY.sizeLg },
          tabBarStyle:        styles.tabBar,
          tabBarActiveTintColor:   COLORS.accent,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarLabelStyle:   styles.tabLabel,
          tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        })}
      >
        <Tab.Screen
          name="Boards"
          component={BoardsScreen}
          options={{ title: 'Boards' }}
        />
        <Tab.Screen
          name="Backlog"
          component={BacklogScreen}
          options={{ title: 'Backlog' }}
        />
        <Tab.Screen
          name="Work Items"
          component={WorkItemsScreen}
          options={{ title: 'Work Items' }}
        />
        <Tab.Screen
          name="Reports"
          component={ReportsScreen}
          options={{ title: 'Reports' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor:    COLORS.surface,
    borderTopColor:     COLORS.border,
    borderTopWidth:     1,
    paddingBottom:      SPACING.sm,
    paddingTop:         SPACING.xs,
    height:             60,
  },
  tabLabel: {
    fontSize:   TYPOGRAPHY.sizeXs,
    fontWeight: TYPOGRAPHY.weightMedium,
    marginBottom: 2,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize:   18,
    color:      COLORS.textSecondary,
  },
  iconFocused: {
    color: COLORS.accent,
  },
});
