import pandas as pd
import numpy as np
import os

DATA_DIR = '../data/full_dataset/'
DATA_COMBINED_DIR = '../data/combined_dataset/'

FILE_1 = 'goemotions_1.csv'
FILE_2 = 'goemotions_2.csv'
FILE_3 = 'goemotions_3.csv'

def load_data():
    try:
        if not os.path.exists(os.path.join(DATA_COMBINED_DIR, 'goemotions_combined.csv')):
            df_1 = pd.read_csv(os.path.join(DATA_DIR, FILE_1))
            df_2 = pd.read_csv(os.path.join(DATA_DIR, FILE_2))
            df_3 = pd.read_csv(os.path.join(DATA_DIR, FILE_3))
            
            combined_df = pd.concat([df_1, df_2, df_3], ignore_index=True)
            os.makedirs(DATA_COMBINED_DIR, exist_ok=True)
            combined_df.to_csv(os.path.join(DATA_COMBINED_DIR, 'goemotions_combined.csv'), index=False)
            print("Data loaded and combined successfully.")
            return combined_df
        else:
            print("Combined data file already exists.")
    except FileNotFoundError as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    load_data() 