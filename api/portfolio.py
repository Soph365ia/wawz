# Роутер портфолио: управляет созданием, получением, редактированием и удалением постов пользователя, включая загрузку изображений.
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from schemas import PortfolioWork, PortfolioWorkCreate
from services.portfolio import PortfolioService
from database import get_db
from dependency import get_current_user
from models import User as UserModel

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])

# Папка для загрузок
UPLOAD_DIR = "static/uploads"

def save_file(file: UploadFile, user_id: str) -> str:
    """Сохраняет файл и возвращает URL"""
    # Генерируем уникальное имя файла
    file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    
    # Создаём папку пользователя
    user_dir = os.path.join(UPLOAD_DIR, user_id)
    os.makedirs(user_dir, exist_ok=True)
    
    # Путь к файлу
    file_path = os.path.join(user_dir, unique_filename)
    
    # Сохраняем файл
    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())
    
    # Возвращаем URL
    return f"/static/uploads/{user_id}/{unique_filename}"

@router.post("/", response_model=PortfolioWork, status_code=status.HTTP_201_CREATED)
async def create_portfolio_work(
    title: str = Form(..., min_length=3, max_length=100),
    description: str = Form(..., min_length=10, max_length=1000),
    visibility: str = Form(default="public"),
    activity_status: str = Form(default="did_hobby"),  
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Создать пост с картинкой (или без)"""
    service = PortfolioService(db)
    
    # Сохраняем файл, если есть
    file_url = None
    if file and file.filename:
        file_url = save_file(file, current_user.id)
    
    # Создаём пост
    portfolio = PortfolioWorkCreate(
        title=title,
        description=description,
        file_url=file_url,
        visibility=visibility,
        activity_status=activity_status  
    )
    
    return service.create_portfolio_work(portfolio, current_user.id)

@router.post("/json", response_model=PortfolioWork, status_code=status.HTTP_201_CREATED)
async def create_portfolio_work_json(
    portfolio: PortfolioWorkCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Создать пост через JSON (без загрузки файла)"""
    service = PortfolioService(db)
    return service.create_portfolio_work(portfolio, current_user.id)

@router.get("/", response_model=list[PortfolioWork])
def get_public_feed(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Получить публичные посты для ленты (пагинация)"""
    service = PortfolioService(db)
    return service.get_public_feed(skip=skip, limit=limit)

@router.get("/my", response_model=list[PortfolioWork])
def get_my_portfolio(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Получить все мои посты"""
    service = PortfolioService(db)
    return service.get_user_portfolio(current_user.id)

@router.get("/{portfolio_id}", response_model=PortfolioWork)
def get_portfolio_work(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Получить пост по ID"""
    service = PortfolioService(db)
    portfolio = service.get_portfolio_by_id(portfolio_id)
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio work not found")
    return portfolio

@router.delete("/{portfolio_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_portfolio_work(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Удалить пост"""
    service = PortfolioService(db)
    success = service.delete_portfolio_work(portfolio_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Portfolio work not found")