import pandas as pd
import io
from fastapi import HTTPException
from app.models.schemas import TransactionInput
from datetime import datetime

class CSVProcessor:
    """
    Handles CSV parsing, validation, and conversion to standard dataframes.
    Ensures column names match the mandatory hackathon requirements.
    """
    
    REQUIRED_COLUMNS = [
        "transaction_id", 
        "sender_id", 
        "receiver_id", 
        "amount", 
        "timestamp"
    ]

    @staticmethod
    def parse_csv(file_content: bytes) -> pd.DataFrame:
        try:
    
            df = pd.read_csv(io.BytesIO(file_content))
            
            
            missing_cols = [col for col in CSVProcessor.REQUIRED_COLUMNS if col not in df.columns]
            if missing_cols:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Missing mandatory columns: {', '.join(missing_cols)}"
                )

            
            df['transaction_id'] = df['transaction_id'].astype(str)
            df['sender_id'] = df['sender_id'].astype(str)
            df['receiver_id'] = df['receiver_id'].astype(str)
            df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0.0)
            
            
            df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
            
            
            df = df.dropna(subset=['sender_id', 'receiver_id', 'timestamp'])
            
            
            df = df.sort_values(by='timestamp').reset_index(drop=True)
            
            return df

        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=400, detail=f"Invalid CSV format: {str(e)}")

    @staticmethod
    def get_unique_accounts(df: pd.DataFrame) -> list:
        """Extracts all unique account IDs from both sender and receiver columns."""
        senders = df['sender_id'].unique()
        receivers = df['receiver_id'].unique()
        return list(set(senders) | set(receivers))