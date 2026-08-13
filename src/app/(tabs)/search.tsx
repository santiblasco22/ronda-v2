import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { EmptyState, LoadingView } from '@/components/EmptyState';
import { ListingCard } from '@/components/ListingCard';
import { Screen } from '@/components/Screen';
import { Colors } from '@/constants/colors';
import { useSearchListings } from '@/features/listings/useListings';
import { useFiltersStore } from '@/store/filtersStore';
import {
  LISTING_CATEGORIES,
  LISTING_CONDITIONS,
  LISTING_SIZES,
  type Listing,
} from '@/types/models';

export default function SearchScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const filters = useFiltersStore();

  const activeFilters = useMemo(
    () => ({
      query: filters.query,
      category: filters.category,
      size: filters.size,
      condition: filters.condition,
      city: filters.city,
      maxPrice: filters.maxPrice,
    }),
    [filters.query, filters.category, filters.size, filters.condition, filters.city, filters.maxPrice]
  );

  const { data: results, isLoading } = useSearchListings(activeFilters);

  const activeFilterCount = [filters.category, filters.size, filters.condition, filters.city || null, filters.maxPrice]
    .filter(Boolean)
    .length;

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Buscar</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            placeholder="Buscar prendas, marcas…"
            placeholderTextColor={Colors.textMuted}
            value={filters.query}
            onChangeText={filters.setQuery}
            style={styles.searchInput}
          />
        </View>
        <Pressable style={styles.filterButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="options-outline" size={20} color={Colors.primaryDark} />
          {activeFilterCount > 0 ? (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {isLoading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={results ?? []}
          key={2}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.column}
          renderItem={({ item }: { item: Listing }) => <ListingCard listing={item} />}
          ListEmptyComponent={
            <EmptyState
              icon="pricetags-outline"
              title="No encontramos publicaciones"
              subtitle="Probá con otros filtros o palabras clave."
            />
          }
        />
      )}

      <FiltersModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </Screen>
  );
}

function FiltersModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const filters = useFiltersStore();
  const [maxPriceText, setMaxPriceText] = useState(filters.maxPrice ? String(filters.maxPrice) : '');

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <Screen>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Filtros</Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={26} color={Colors.text} />
          </Pressable>
        </View>
        <ScrollView>
          <Text style={styles.sectionLabel}>Categoría</Text>
          <View style={styles.chipsRow}>
            {LISTING_CATEGORIES.map((category) => (
              <Chip
                key={category}
                label={category}
                selected={filters.category === category}
                onPress={() => filters.setCategory(filters.category === category ? null : category)}
              />
            ))}
          </View>

          <Text style={styles.sectionLabel}>Talle</Text>
          <View style={styles.chipsRow}>
            {LISTING_SIZES.map((size) => (
              <Chip
                key={size}
                label={size}
                selected={filters.size === size}
                onPress={() => filters.setSize(filters.size === size ? null : size)}
              />
            ))}
          </View>

          <Text style={styles.sectionLabel}>Estado</Text>
          <View style={styles.chipsRow}>
            {LISTING_CONDITIONS.map((condition) => (
              <Chip
                key={condition}
                label={condition}
                selected={filters.condition === condition}
                onPress={() => filters.setCondition(filters.condition === condition ? null : condition)}
              />
            ))}
          </View>

          <Text style={styles.sectionLabel}>Ciudad</Text>
          <TextInput
            placeholder="Ej: Rosario"
            placeholderTextColor={Colors.textMuted}
            value={filters.city}
            onChangeText={filters.setCity}
            style={styles.textInput}
          />

          <Text style={styles.sectionLabel}>Precio máximo</Text>
          <TextInput
            placeholder="Sin límite"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            value={maxPriceText}
            onChangeText={(value) => {
              setMaxPriceText(value);
              const parsed = Number(value);
              filters.setMaxPrice(value && !Number.isNaN(parsed) ? parsed : null);
            }}
            style={styles.textInput}
          />
        </ScrollView>

        <View style={styles.modalFooter}>
          <Button
            label="Limpiar filtros"
            variant="ghost"
            onPress={() => {
              filters.reset();
              setMaxPriceText('');
            }}
          />
          <Button label="Ver resultados" onPress={onClose} style={styles.applyButton} />
        </View>
      </Screen>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  filterBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  list: {
    padding: 12,
    flexGrow: 1,
  },
  column: {
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 18,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    gap: 10,
  },
  applyButton: {
    flex: 1,
  },
});
