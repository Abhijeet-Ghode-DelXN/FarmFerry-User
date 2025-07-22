const CategoryItem = ({ item }) => {
  const isSelected = selectedCategory === item.name;

  return (
    <View style={{ width: width * 0.23, alignItems: 'center', marginBottom: 16 }}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={{ width: '100%' }}
        onPress={() => setSelectedCategory(item.name)}
      >
        <View
          style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 8,
            marginBottom: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
            borderWidth: 2,
            borderColor: isSelected ? '#10b981' : '#f3f4f6',
          }}
        >
          <View style={{ width: '100%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden' }}>
            <Image
              source={{ uri: item.image }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
        </View>
        <Text
          style={{
            fontSize: 14,
            color: isSelected ? '#10b981' : '#1f2937',
            fontWeight: '600',
            textAlign: 'center',
          }}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
