"""
System Monitoring Service
Provides system health checks and performance metrics
"""
import psutil
import os
from typing import Dict, Any, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import text

class SystemMonitoringService:
    def __init__(self, db: Session = None):
        self.db = db
    
    def get_system_health(self) -> Dict[str, Any]:
        """Get overall system health status"""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # Determine health status
            health_status = "healthy"
            issues = []
            
            if cpu_percent > 80:
                health_status = "warning"
                issues.append(f"High CPU usage: {cpu_percent}%")
            
            if memory.percent > 85:
                health_status = "warning"
                issues.append(f"High memory usage: {memory.percent}%")
            
            if disk.percent > 90:
                health_status = "critical"
                issues.append(f"High disk usage: {disk.percent}%")
            
            return {
                "status": health_status,
                "timestamp": datetime.now().isoformat(),
                "issues": issues,
                "services": {
                    "database": self._check_database_health(),
                    "api": "healthy"
                }
            }
        except Exception as e:
            return {
                "status": "error",
                "timestamp": datetime.now().isoformat(),
                "issues": [f"Failed to get system health: {str(e)}"],
                "services": {}
            }
    
    def get_system_metrics(self) -> Dict[str, Any]:
        """Get detailed system metrics"""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            return {
                "cpu": {
                    "usage_percent": cpu_percent,
                    "count": cpu_count,
                    "per_cpu": psutil.cpu_percent(interval=1, percpu=True)
                },
                "memory": {
                    "total_gb": round(memory.total / (1024**3), 2),
                    "available_gb": round(memory.available / (1024**3), 2),
                    "used_gb": round(memory.used / (1024**3), 2),
                    "percent": memory.percent
                },
                "disk": {
                    "total_gb": round(disk.total / (1024**3), 2),
                    "free_gb": round(disk.free / (1024**3), 2),
                    "used_gb": round(disk.used / (1024**3), 2),
                    "percent": disk.percent
                },
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "error": f"Failed to get system metrics: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
    
    def get_database_metrics(self) -> Dict[str, Any]:
        """Get database performance metrics"""
        if not self.db:
            return {"error": "Database session not available"}
        
        try:
            # Test database connection
            self.db.execute(text("SELECT 1"))
            
            # Get database size (works for SQLite)
            db_path = os.getenv("DATABASE_URL", "").replace("sqlite:///", "")
            if os.path.exists(db_path):
                db_size = os.path.getsize(db_path)
            else:
                db_size = 0
            
            return {
                "status": "connected",
                "database_size_mb": round(db_size / (1024**2), 2),
                "connection_pool": "healthy",
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def get_api_metrics(self) -> Dict[str, Any]:
        """Get API performance metrics"""
        # This would typically integrate with logging/monitoring tools
        # For now, return basic placeholder metrics
        return {
            "avg_response_time_ms": 45,
            "requests_per_minute": 120,
            "error_rate_percent": 0.5,
            "endpoints_health": "healthy",
            "timestamp": datetime.now().isoformat()
        }
    
    def get_recent_errors(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent application errors"""
        # This would typically read from error logs
        # Placeholder implementation
        return []
    
    def _check_database_health(self) -> str:
        """Check if database is healthy"""
        if not self.db:
            return "unknown"
        
        try:
            self.db.execute(text("SELECT 1"))
            return "healthy"
        except Exception:
            return "unhealthy"
