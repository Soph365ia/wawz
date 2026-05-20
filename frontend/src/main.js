const postsAPI = {
  feed(skip = 0, limit = 20) { return request(`/portfolio/?skip=${skip}&limit=${limit}`); },
  create(post) { return request('/portfolio/json', { method: 'POST', body: JSON.stringify(post) }); },
  like(postId) { return request(`/likes/${postId}`, { method: 'POST' }); },
  unlike(postId) { return request(`/likes/${postId}`, { method: 'DELETE' }); }
};