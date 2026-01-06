import pandas as pd
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
PROJECT_SRC_ROOT = os.path.dirname(current_dir)
DATA_DIR = os.path.join(PROJECT_SRC_ROOT, 'data/full_dataset')
DATA_COMBINED_DIR = os.path.join(PROJECT_SRC_ROOT, 'data/combined_dataset')

def load_and_combine_data():
    output_file = os.path.join(DATA_COMBINED_DIR, 'goemotions_combined.csv')
    if not os.path.exists(output_file):
        try:
            df_1 = pd.read_csv(os.path.join(DATA_DIR, 'goemotions_1.csv'))
            df_2 = pd.read_csv(os.path.join(DATA_DIR, 'goemotions_2.csv'))
            df_3 = pd.read_csv(os.path.join(DATA_DIR, 'goemotions_3.csv'))
            
            combined_df = pd.concat([df_1, df_2, df_3], ignore_index=True)
            os.makedirs(DATA_COMBINED_DIR, exist_ok=True)
            combined_df.to_csv(output_file, index=False)
            print("Data combined successfully.")
            return combined_df
        except FileNotFoundError as e:
            print(f"Error: {e}")
    else:
        print("Combined data already exists.")
        return pd.read_csv(output_file)

if __name__ == "__main__":
    load_and_combine_data()