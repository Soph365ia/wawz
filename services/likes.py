from sqlalchemy.orm import Session
from models import Like, PortfolioWork
from sqlalchemy.exc import IntegrityError

class LikeService:
    def __init__(self, db: Session):
        self.db = db

    def toggle_like(self, user_id: str, portfolio_id: int) -> dict:
        """Поставить или убрать лайк"""
        # Проверяем, существует ли пост
        portfolio = self.db.query(PortfolioWork).filter(PortfolioWork.id == portfolio_id).first()
        if not portfolio:
            raise ValueError("Portfolio work not found")
        
        # Проверяем, есть ли уже лайк
        existing_like = self.db.query(Like).filter(
            Like.user_id == user_id,
            Like.portfolio_id == portfolio_id
        ).first()
        
        if existing_like:
            # Убираем лайк
            self.db.delete(existing_like)
            self.db.commit()
            liked = False
        else:
            # Ставим лайк
            like = Like(user_id=user_id, portfolio_id=portfolio_id)
            self.db.add(like)
            self.db.commit()
            liked = True
        
        # Считаем общее количество лайков
        total_likes = self.db.query(Like).filter(Like.portfolio_id == portfolio_id).count()
        
        return {
            "liked": liked,
            "total_likes": total_likes
        }

    def remove_like(self, user_id: str, portfolio_id: int) -> bool:
        """Удалить лайк, если он существует"""
        existing_like = self.db.query(Like).filter(
            Like.user_id == user_id,
            Like.portfolio_id == portfolio_id
        ).first()
        
        if existing_like:
            self.db.delete(existing_like)
            self.db.commit()
            return True
        return False

    def get_liked_posts(self, user_id: str) -> list:
        """Получить все посты, которые лайкнул пользователь"""
        likes = self.db.query(Like).filter(Like.user_id == user_id).all()
        portfolio_ids = [like.portfolio_id for like in likes]
        
        posts = self.db.query(PortfolioWork).filter(PortfolioWork.id.in_(portfolio_ids)).all()
        return posts

    def get_likes_count(self, portfolio_id: int) -> int:
        """Получить количество лайков для поста"""
        return self.db.query(Like).filter(Like.portfolio_id == portfolio_id).count()