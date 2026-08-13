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
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors } from '@/constants/colors';
import { HitSlop, MIN_TOUCH_TARGET, Radius, Spacing, Typography } from '@/constants/theme';
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

  const { data: results, isLoading, isError, refetch } = useSearchListings(activeFilters);

  const activeFilterCount = [
    filters.category,
    filters.size,
    filters.condition,
    filters.city || null,
    filters.maxPrice,
  ].filter(Boolean).length;

  const hasAnyCriteria = activeFilterCount > 0 || Boolean(filters.query.trim());

  return (
    <Screen padded={false}>
      <ScreenHeader title="Encontrá" subtitle="Filtrá la ronda a tu manera" />

      <View style={styles.searchRow}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            placeholder="Prenda, color o categoría…"
            placeholderTextColor={Colors.textMuted}
            value={filters.query}
            onChangeText={filters.setQuery}
            style={styles.searchInput}
            returnKeyType="search"
            accessibilityLabel="Buscar prendas"
          />
          {filters.query ? (
            <Pressable
              onPress={() => filters.setQuery('')}
              hitSlop={HitSlop.small}
              accessibilityRole="button"
              accessibilityLabel="Borrar la búsqueda"
            >
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          style={({ pressed }) => [styles.filterButton, pressed && styles.filterButtonPressed]}
          onPress={() => setModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={
            activeFilterCount > 0 ? `Filtros, ${activeFilterCount} activos` : 'Filtros'
          }
        >
          <Ionicons name="options-outline" size={20} color={Colors.primaryInk} />
          {activeFilterCount > 0 ? (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {activeFilterCount > 0 ? (
        <View style={styles.activeFiltersRow}>
          <Text style={styles.activeFiltersText}>
            {activeFilterCount} {activeFilterCount === 1 ? 'filtro activo' : 'filtros activos'}
          </Text>
          <Pressable
            onPress={filters.reset}
            hitSlop={HitSlop.small}
            accessibilityRole="button"
            accessibilityLabel="Limpiar todos los filtros"
          >
            <Text style={styles.clearFilters}>Limpiar</Text>
          </Pressable>
        </View>
      ) : null}

      {isLoading ? (
        <LoadingView label="Revisando percheros…" />
      ) : isError ? (
        <EmptyState
          icon="cloud-offline-outline"
          tone="danger"
          title="No pudimos hacer la búsqueda"
          subtitle="Revisá tu conexión. Tus filtros siguen tal como los dejaste."
          actionLabel="Volver a intentar"
          onAction={() => refetch()}
        />
      ) : (
        <FlatList
          data={results ?? []}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.column}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            results?.length ? (
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsEyebrow}>SELECCIÓN PARA VOS</Text>
                <Text style={styles.resultsCount}>
                  {results.length} {results.length === 1 ? 'hallazgo' : 'hallazgos'}
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }: { item: Listing }) => <ListingCard listing={item} />}
          ListEmptyComponent={
            hasAnyCriteria ? (
              <EmptyState
                icon="search-outline"
                title="Esa combinación no apareció"
                subtitle="Probá sacando un filtro, cambiando la ciudad o ampliando el precio."
                actionLabel="Limpiar filtros"
                onAction={filters.reset}
              />
            ) : (
              <EmptyState
                icon="pricetags-outline"
                title="El perchero espera su primera prenda"
                subtitle="Cuando la comunidad publique, acá vas a poder explorar por talle, estado, ciudad y precio."
              />
            )
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
      <Screen bottomSafe>
        <View style={styles.sheetHandle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle} accessibilityRole="header">
            Filtros
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={HitSlop.medium}
            accessibilityRole="button"
            accessibilityLabel="Cerrar filtros"
          >
            <Ionicons name="close" size={26} color={Colors.text} />
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
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
            accessibilityLabel="Filtrar por ciudad"
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
            accessibilityLabel="Filtrar por precio máximo"
          />
        </ScrollView>

        <View style={styles.modalFooter}>
          <Button
            label="Limpiar"
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
  searchRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    minHeight: 52,
  },
  searchInput: {
    flex: 1,
    minHeight: 50,
    paddingVertical: Spacing.sm,
    fontSize: 15,
    color: Colors.text,
  },
  filterButton: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primarySoft,
    borderWidth: 1.5,
    borderColor: Colors.primaryInk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonPressed: {
    backgroundColor: Colors.primarySoft,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: Colors.textOnPrimary,
    fontSize: 11,
    fontWeight: '800',
  },
  activeFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  activeFiltersText: {
    ...Typography.micro,
  },
  clearFilters: {
    ...Typography.micro,
    color: Colors.primaryInk,
    fontWeight: '700',
  },
  list: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    flexGrow: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.xs,
  },
  resultsEyebrow: { ...Typography.micro, color: Colors.primaryInk },
  resultsCount: { ...Typography.caption, fontWeight: '700' },
  column: {
    gap: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  sheetHandle: {
    width: 42,
    height: 5,
    borderRadius: Radius.pill,
    backgroundColor: Colors.borderStrong,
    alignSelf: 'center',
    marginTop: Spacing.sm,
  },
  modalTitle: {
    ...Typography.title,
  },
  sectionLabel: {
    ...Typography.sectionTitle,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.md,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  textInput: {
    minHeight: MIN_TOUCH_TARGET,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 15,
    color: Colors.text,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  applyButton: {
    flex: 1,
  },
});
