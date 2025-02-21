import React, { useState } from 'react';
import { View, TextInput, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import debounce from 'lodash/debounce';

// Add type declaration for lodash/debounce
declare module 'lodash/debounce' {
  const debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait?: number,
    options?: {
      leading?: boolean;
      trailing?: boolean;
      maxWait?: number;
    }
  ) => T & { cancel(): void; flush(): void };
  export default debounce;
}

interface GifSearchProps {
  onSelect: (gifUrl: string) => void;
}

export const GifSearch: React.FC<GifSearchProps> = ({ onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Array<{id: string; url: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGifId, setSelectedGifId] = useState<string | null>(null);

  const searchGifs = async (query: string) => {
    if (!query) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=YOUR_GIPHY_API_KEY&q=${encodeURIComponent(
          query
        )}&limit=20`
      );
      const data = await response.json();
      setResults(
        data.data.map((gif: any) => ({
          id: gif.id,
          url: gif.images.fixed_height.url,
        }))
      );
    } catch (error) {
      console.error('Error searching gifs:', error);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = React.useCallback(
    debounce((query: string) => searchGifs(query), 500),
    []
  );

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };

  const handleSelect = (gif: {id: string; url: string}) => {
    setSelectedGifId(gif.id);
    onSelect(gif.url);
  };

  return (
    <ThemedView style={styles.container}>
      <TextInput
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={handleSearch}
        placeholder="Search for GIFs..."
        placeholderTextColor="#999"
      />

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.gifContainer,
                selectedGifId === item.id && styles.selectedGif,
              ]}
              onPress={() => handleSelect(item)}
            >
              <Image source={{ uri: item.url }} style={styles.gif} />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.resultsList}
        />
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  loader: {
    marginTop: 20,
  },
  resultsList: {
    paddingBottom: 20,
  },
  gifContainer: {
    flex: 1,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  gif: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  selectedGif: {
    borderWidth: 3,
    borderColor: '#007AFF',
  },
}); 