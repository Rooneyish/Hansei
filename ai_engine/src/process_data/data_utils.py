import pandas as pd
import numpy as np
import contractions as ct
import os
from sklearn.model_selection import train_test_split

# Get the project root directory relative to this file
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def clean_text(text):
    text = str(text).lower()
    text = ct.fix(text)
    return ' '.join(text.split())

def get_processed_data():
    data_dir = os.path.join(PROJECT_ROOT, "data", "full_dataset")
    
    # Load raw files
    try:
        df_1 = pd.read_csv(os.path.join(data_dir, "goemotions_1.csv"))
        df_2 = pd.read_csv(os.path.join(data_dir, "goemotions_2.csv"))
        df_3 = pd.read_csv(os.path.join(data_dir, "goemotions_3.csv"))
    except FileNotFoundError as e:
        print(f"Error: Could not find CSVs in {data_dir}. Check folder structure.")
        raise e

    df = pd.concat([df_1, df_2, df_3])

    # Aggregation logic (Consensus ~58k rows)
    emotion_columns = df.columns[9:]
    grouped_df = df.groupby(['id', 'text'])[emotion_columns].sum().reset_index()

    for col in emotion_columns:
        grouped_df[col] = (grouped_df[col] > 0).astype(int)

    master_df = grouped_df.drop(columns=['id'])
    master_df['text'] = master_df['text'].apply(clean_text)

    master_emotions_df = master_df[master_df['neutral']==0].copy()
    master_emotions_df = master_emotions_df.drop(columns=['neutral'])

    X = master_emotions_df['text']
    y = master_emotions_df.iloc[:, 1:].values 

    X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.3, random_state=42)
    X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.5, random_state=42)

    return (X_train, y_train), (X_val, y_val), (X_test, y_test)