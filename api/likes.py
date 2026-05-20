# Роутер лайков: позволяет ставить/убирать лайк с поста, получать список лайкнутых постов и считать общее количество лайков у поста.
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from dependency import get_current_user
from models import User as UserModel
from services.likes import LikeService
from schemas import LikeResponse, PortfolioWork 

router = APIRouter(prefix="/likes", tags=["Likes"])

@router.post("/{portfolio_id}", response_model=LikeResponse)
def toggle_like(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Поставить или убрать лайк с поста"""
    service = LikeService(db)
    try:
        return service.toggle_like(current_user.id, portfolio_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/{portfolio_id}")
def remove_like(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Удалить лайк с поста"""
    service = LikeService(db)
    removed = service.remove_like(current_user.id, portfolio_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Like not found")
    return {"message": "Like removed", "portfolio_id": portfolio_id}

@router.get("/my", response_model=list[PortfolioWork])  
def get_my_liked_posts(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Получить все посты, которые я лайкнул"""
    service = LikeService(db)
    posts = service.get_liked_posts(current_user.id)
    return [PortfolioWork.model_validate(post) for post in posts]

@router.get("/{portfolio_id}/count")
def get_likes_count(
    portfolio_id: int,
    db: Session = Depends(get_db)
):
    """Получить количество лайков для поста"""
    service = LikeService(db)
    count = service.get_likes_count(portfolio_id)
    return {"portfolio_id": portfolio_id, "likes_count": count}