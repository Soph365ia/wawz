// --- Загрузка постов (теперь через api.js)
    async function loadFeed() {
      try {
        // Вызов через api.js
        const myPostsData = await window.api.postsAPI.my();
        myPosts.value = myPostsData;

        const allPostsData = await window.api.postsAPI.feed();
        allPosts.value = allPostsData.map(p => ({
          ...p,
          time: formatDateRelative(p.created_at),
          liked: false, // будет обновлено позже
          expanded: false
        }));

        // Загружаем лайки
        const likedPosts = await window.api.postsAPI.myLiked();
        allPosts.value.forEach(p => {
          p.liked = likedPosts.some(likedPost => likedPost.id === p.id);
        });

        userStats.posts = myPosts.value.length;
        showToast('✨ Лента загружена');
      } catch (err) {
        console.error('Ошибка загрузки ленты:', err);
        showToast('Не удалось загрузить ленту');
      }
    }