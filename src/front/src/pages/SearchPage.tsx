import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Anchor,
  Card,
  Loader,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useDebounce } from '../hooks/useDebounce';
import { search as apiSearch } from '../api/endpoints';
import type { SearchResult } from '../types';

export function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    let cancelled = false;

    const doSearch = async () => {
      setLoading(true);
      try {
        const data = await apiSearch(debouncedQuery.trim());
        if (!cancelled) {
          setResults(data);
          setSearched(true);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
          setSearched(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void doSearch();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  return (
    <Stack gap="md">
      <Title order={3}>Поиск</Title>

      <TextInput
        placeholder="Введите запрос для поиска..."
        leftSection={<IconSearch size={16} />}
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        size="md"
        autoFocus
      />

      {loading && <Loader />}

      {!loading && searched && results.length === 0 && (
        <Text c="dimmed" ta="center">
          Нет результатов
        </Text>
      )}

      {!loading &&
        results.map((result, index) => (
          <Card key={index} shadow="xs" padding="md" withBorder>
            <Anchor
              fw={600}
              onClick={() =>
                navigate(`/institutions/${result.institution_id}`)
              }
              style={{ cursor: 'pointer' }}
            >
              {result.institution_short_name}
            </Anchor>
            <Text size="sm" c="dimmed" mt={4}>
              {result.territorial_org_name}
            </Text>
            <Text
              size="sm"
              mt={4}
              dangerouslySetInnerHTML={{ __html: result.matched_text }}
            />
          </Card>
        ))}
    </Stack>
  );
}
