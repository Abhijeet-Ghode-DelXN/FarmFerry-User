# FarmFerry-User Header System Guide

## Overview
The new header system provides a consistent, responsive design across all screens in the FarmFerry-User application. It includes predefined variants for common use cases and supports custom configurations.

## Basic Usage

### Import the Header Component
```javascript
import Header, { HeaderVariants } from '../components/ui/Header';
```

### Using Predefined Variants

#### 1. Main App Header (Home Screen)
```javascript
// For the main app screen with logo, location, and notifications
<HeaderVariants.Main />

// Or with custom title
<HeaderVariants.Main title="Custom Title" />
```

#### 2. Simple Back Button Header
```javascript
// Basic back button with title
<HeaderVariants.Back title="My Orders" />

// With custom back action
<HeaderVariants.Back 
  title="My Orders" 
  onBackPress={() => {
    // Custom back logic
    navigation.navigate('Home');
  }}
/>
```

#### 3. Header with Search
```javascript
// Back button with search functionality
<HeaderVariants.BackWithSearch 
  title="Search Products"
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  searchPlaceholder="Search fresh produce..."
/>
```

#### 4. Header with Filter
```javascript
// Back button with filter button
<HeaderVariants.BackWithFilter 
  title="Categories"
  onFilterPress={() => {
    // Handle filter action
  }}
/>
```

#### 5. Header with Search and Filter
```javascript
// Back button with both search and filter
<HeaderVariants.BackWithSearchAndFilter 
  title="Products"
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  onFilterPress={handleFilter}
/>
```

### Using the Base Header Component

For more custom configurations, use the base `Header` component:

```javascript
<Header
  // Basic props
  title="Custom Title"
  showBack={true}
  showLogo={false}
  showLocation={false}
  showNotifications={false}
  showSearch={false}
  showFilter={false}
  
  // Custom actions
  onBackPress={() => navigation.goBack()}
  onLogoPress={() => navigation.navigate('Home')}
  onSearchPress={() => setShowSearch(true)}
  onFilterPress={() => setShowFilter(true)}
  onNotificationPress={() => navigation.navigate('Notifications')}
  
  // Search functionality
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  searchPlaceholder="Search..."
  
  // Styling
  backgroundColor="white"
  textColor="#374151"
  iconColor="#10B981"
  borderColor="#e5e7eb"
  
  // Layout
  paddingHorizontal={16}
  showBorder={true}
  showShadow={true}
  
  // Custom content
  children={<CustomFilterTabs />}
  rightContent={<CustomRightButton />}
/>
```

## Screen Migration Examples

### Before (OrdersScreen)
```javascript
// Old header implementation
<View className={`bg-white px-4 ${responsiveValue('pt-4 pb-3', 'pt-5 pb-4', 'pt-6 pb-5')} shadow-sm`}>
  <View className="flex-row items-center mb-4">
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      className={`mr-3 p-1.5 rounded-full bg-gray-100`}
      hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
    >
      <Ionicons name="arrow-back" size={responsiveValue(18, 20, 20)} color="#10B981" />
    </TouchableOpacity>
    <Text className={`${responsiveValue('text-xl', 'text-2xl', 'text-2xl')} font-bold text-gray-800`}>
      My Orders
    </Text>
  </View>
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    {filterOptions.map(renderFilterTab)}
  </ScrollView>
</View>
```

### After (OrdersScreen)
```javascript
// New header implementation
<Header
  showBack={true}
  title="My Orders"
  children={
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="py-1"
      contentContainerStyle={{ paddingRight: 16 }}
    >
      {filterOptions.map(renderFilterTab)}
    </ScrollView>
  }
/>
```

### Before (HomeScreen)
```javascript
// Old header implementation
<AppBar />
```

### After (HomeScreen)
```javascript
// New header implementation
<HeaderVariants.Main />
```

## Responsive Design

The header automatically adapts to different screen sizes:

- **Small screens** (< 375px): Compact layout with smaller icons and text
- **Medium screens** (375px - 768px): Standard layout
- **Large screens** (≥ 768px): Expanded layout with larger elements

## Customization Options

### Colors
```javascript
<Header
  backgroundColor="#ffffff"
  textColor="#374151"
  iconColor="#10B981"
  borderColor="#e5e7eb"
/>
```

### Layout
```javascript
<Header
  paddingHorizontal={20}
  showBorder={false}
  showShadow={false}
/>
```

### Status Bar
```javascript
<Header
  statusBarStyle="light-content"
  statusBarBackgroundColor="#000000"
/>
```

## Advanced Usage

### Custom Right Content
```javascript
<Header
  showBack={true}
  title="My Profile"
  rightContent={
    <TouchableOpacity
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      onPress={() => navigation.navigate('Settings')}
    >
      <Ionicons name="settings-outline" size={20} color="#10B981" />
    </TouchableOpacity>
  }
/>
```

### Custom Children Content
```javascript
<Header
  showBack={true}
  title="Products"
  children={
    <View style={{ marginTop: 16 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {categories.map(category => (
          <TouchableOpacity key={category.id} style={{ marginRight: 12 }}>
            <Text>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  }
/>
```

## Migration Checklist

To migrate existing screens to the new header system:

1. **Import the Header component**
   ```javascript
   import Header, { HeaderVariants } from '../components/ui/Header';
   ```

2. **Remove old header code**
   - Remove custom header View components
   - Remove manual StatusBar components
   - Remove custom responsive calculations

3. **Replace with new header**
   - Use appropriate HeaderVariants for common cases
   - Use base Header component for custom needs
   - Move filter tabs, search bars, etc. to children prop

4. **Test responsiveness**
   - Test on different screen sizes
   - Verify touch targets are appropriate
   - Check status bar behavior

## Benefits

- **Consistency**: All screens now have the same header design language
- **Responsiveness**: Automatic adaptation to different screen sizes
- **Maintainability**: Single source of truth for header logic
- **Flexibility**: Easy customization while maintaining consistency
- **Performance**: Optimized rendering and touch handling
- **Accessibility**: Proper touch targets and navigation patterns
