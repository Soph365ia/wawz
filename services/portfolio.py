from sqlalchemy.orm import Session
from models import PortfolioWork as PortfolioWorkModel
from schemas import PortfolioWork, PortfolioWorkCreate
from datetime import datetime

class PortfolioService:
    def __init__(self, db: Session):
        self.db = db

    def create_portfolio_work(self, portfolio: PortfolioWorkCreate, user_id: str) -> PortfolioWork:
        db_portfolio = PortfolioWorkModel(
            user_id=user_id,
            title=portfolio.title,
            description=portfolio.description,
            file_url=portfolio.file_url,
            visibility=portfolio.visibility,
            activity_status=portfolio.activity_status,
            created_at=datetime.utcnow()
    )
        self.db.add(db_portfolio)
        self.db.commit()
        self.db.refresh(db_portfolio)
        return PortfolioWork.model_validate(db_portfolio)

    def get_user_portfolio(self, user_id: str) -> list[PortfolioWork]:
        return [
            PortfolioWork.model_validate(p) 
            for p in self.db.query(PortfolioWorkModel)
            .filter(PortfolioWorkModel.user_id == user_id)
            .order_by(PortfolioWorkModel.created_at.desc())
            .all()
        ]

    def get_public_feed(self, skip: int = 0, limit: int = 20) -> list[PortfolioWork]:
        """
        Получить публичные посты для ленты с пагинацией
        """
        query = self.db.query(PortfolioWorkModel).filter(
            PortfolioWorkModel.visibility == "public"
        ).order_by(PortfolioWorkModel.created_at.desc())
        
        if skip:
            query = query.offset(skip)
        if limit:
            query = query.limit(limit)
        
        return [PortfolioWork.model_validate(p) for p in query.all()]

    def get_portfolio_by_id(self, portfolio_id: int) -> PortfolioWork | None:
        db_portfolio = self.db.query(PortfolioWorkModel).filter(
            PortfolioWorkModel.id == portfolio_id
        ).first()
        return PortfolioWork.model_validate(db_portfolio) if db_portfolio else None

    def delete_portfolio_work(self, portfolio_id: int, user_id: str) -> bool:
        db_portfolio = self.db.query(PortfolioWorkModel).filter(
            PortfolioWorkModel.id == portfolio_id,
            PortfolioWorkModel.user_id == user_id
        ).first()
        
        if db_portfolio:
            from models import Like as LikeModel
            self.db.query(LikeModel).filter(
                LikeModel.portfolio_id == portfolio_id
            ).delete(synchronize_session=False)
            
            self.db.delete(db_portfolio)
            self.db.commit()
            return True
        return False