import { ref, onMounted } from 'vue';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

export function useContentBlock() {
  const blockedContent = ref({
    movies: [],
    tv: []
  });

  const loadBlockedContent = async () => {
    try {
      const blockedRef = doc(db, 'settings', 'blockedContent');
      const blockedSnap = await getDoc(blockedRef);
      if (blockedSnap.exists()) {
        blockedContent.value = blockedSnap.data();
      } else {
        blockedContent.value = { movies: [], tv: [] };
      }
    } catch (error) {
      console.error('Error loading blocked content:', error);
      blockedContent.value = { movies: [], tv: [] };
    }
  };

  const isBlocked = (type, id) => {
    const contentType = type === 'movie' ? 'movies' : 'tv';
    return blockedContent.value[contentType].includes(id);
  };

  onMounted(() => {
    loadBlockedContent();
  });

  return {
    isBlocked,
    loadBlockedContent
  };
}
