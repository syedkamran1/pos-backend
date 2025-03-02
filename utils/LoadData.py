import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import re
import time
import random

from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Read database credentials from environment variables
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")


# Function to connect to PostgreSQL database
# Function to create a SQLAlchemy engine
def get_db_engine():
    db_url = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    engine = create_engine(db_url)
    return engine

def load_xlsx_to_postgres(xlsx_file_path, engine):
    # Load the Excel file into a DataFrame
    df = pd.read_excel(xlsx_file_path)
    print("\n")
    print("Working on Categories")
    unique_categories = df['Category'].dropna().unique()
    #print(unique_categories)
    description = [category + ' Description.' for category in unique_categories]
    #print(description)
    df_categories = pd.DataFrame({
        'name' : unique_categories,
        'description' : description
    })
    #print(df_categories)

    # Fetch existing names from the database
    existing_category_names = pd.read_sql_table('categories', engine)
    #print(existing_category_names)
    
    # Filter out rows that already exist in the database
    df_categories = df_categories[~df_categories['name'].isin(existing_category_names['name'])]
    #print(df_categories)

    # Save the DataFrame to the PostgreSQL table
    print(f"Adding {len(df_categories)} new categories to the database.")
    output_dir = os.path.join(os.path.dirname(xlsx_file_path), 'output')
    os.makedirs(output_dir, exist_ok=True)
    timestamp = time.strftime("%Y%m%d-%H%M%S")
    df_categories.to_excel(os.path.join(output_dir, f'categories_{timestamp}.xlsx'), index=False)
    df_categories.to_sql('categories', engine, if_exists='append', index=False)
    existing_category_names = pd.read_sql_table('categories', engine)



    print("\n")
    print("**********" * 10)
    print("Working on Products")

    # Fetch existing names from the database
    existing_product_names = pd.read_sql_table('product', engine)
    #print(existing_product_names)
    df_product = df[['Product Name', 'Product Description', 'Design No', 'Category']].dropna()
    #print(df_product)
    
    # Filter out rows that already exist in the database
    df_product = df_product[~df_product['Product Name'].isin(existing_product_names['item_name'])]
    df_product['category_id'] = df_product['Category'].apply(lambda x: existing_category_names[existing_category_names['name'] == x]['id'].values[0])
    df_product.drop_duplicates(inplace=True)
    df_product.drop(columns=['Category'], inplace=True)
    #print(df_product.shape)
    #print(df_product)
    
    df_product.rename(columns = {'Product Name':'item_name', 'Product Description':'description', 'Design No':'design_no'}, inplace=True)
    #print(df_product)
    print(f"Adding {len(df_product)} new products to the database.")
    timestamp = time.strftime("%Y%m%d-%H%M%S")
    df_product.to_excel(os.path.join(output_dir, f'products_{timestamp}.xlsx'), index=False)
    df_product.to_sql('product', engine, if_exists='append', index=False)
    existing_product_names = pd.read_sql_table('product', engine)
    

    print("\n")
    print("**********" * 10)
    print("Working on Variants")
    # Fetch existing names from the database
    existing_variant_names = pd.read_sql_table('productvariants', engine)
    #print(existing_variant_names)

    df_variant = df[['Image','Product Name', 'Size', 'Colour', 'Price', 'SKU']].dropna()
    #print(df_variant)
    df_variant['Image'] = df_variant['Image'].apply(lambda x: f"http://192.168.0.75:5000/images/{x.split('/')[-1].replace(' ', '%20')}")
    #print(df_variant['Image'])
    df_variant = df_variant[~df_variant['SKU'].isin(existing_variant_names['sku'])]
    #df_variant.drop_duplicates(inplace=True)
    df_variant['barcode'] = df_variant['SKU'].apply(lambda x:generate_barcode_text(x))
    df_variant['product_id'] = df_variant['Product Name'].apply(lambda x: existing_product_names[existing_product_names['item_name'] == x]['id'].values[0])
    df_variant.rename(columns = {'Image': 'image_url', 'Size':'size', 'Colour':'color', 'Price':'price', 'SKU':'sku'}, inplace=True)
    df_variant.drop(columns=['Product Name'], inplace=True)
    #print(df_variant)
    print(f"Adding {len(df_variant)} new variants to the database.")
    timestamp = time.strftime("%Y%m%d-%H%M%S")
    df_variant.to_excel(os.path.join(output_dir, f'variants_{timestamp}.xlsx'), index=False)
    df_variant.to_sql('productvariants', engine, if_exists='append', index=False)
    existing_variant_names = pd.read_sql_table('productvariants', engine)

    print("\n")
    print("**********" * 10)
    print("Working on Inventory")
    # Fetch existing names from the database
    existing_inventory_names = pd.read_sql_table('inventory', engine)
    #print(existing_inventory_names)
    df_inventory = df[['SKU', 'Stock']].dropna()
    #print(df_inventory)
    
    #print(existing_variant_names[existing_variant_names['sku'] == 'CAS-FRONT-SHOP-101'])
    #print(df_inventory['SKU'])

    df_inventory['product_variant_id'] = df_inventory['SKU'].apply(lambda x: existing_variant_names[existing_variant_names['sku'] == x]['id'].values[0])
    #print(df_inventory)
    df_inventory = df_inventory[~df_inventory['product_variant_id'].isin(existing_inventory_names['product_variant_id'])]
    #print(df_inventory)
    df_inventory.drop_duplicates(inplace=True)
    df_inventory.rename(columns = {'Stock':'stock'}, inplace=True)
    df_inventory.drop(columns=['SKU'], inplace=True)
    #print(df_inventory)
    print(f"Adding {len(df_inventory)} new inventory to the database.")
    timestamp = time.strftime("%Y%m%d-%H%M%S")
    df_inventory.to_excel(os.path.join(output_dir, f'inventory_{timestamp}.xlsx'), index=False)
    
    df_inventory.to_sql('inventory', engine, if_exists='append', index=False)
    existing_inventory_names = pd.read_sql_table('inventory', engine)



def generate_barcode_text(item_name):
    # 1. Extract the first 2-3 alphanumeric characters from the item name
    name_hash = re.sub(r'[^A-Z0-9]', '', item_name.upper())[:5]  # Remove special characters and take the first 5 characters

    # 2. Get current timestamp in milliseconds (13-digit number)
    timestamp = str(int(time.time() * 1000))[-8:]  # Take last 8 digits for brevity

    # 3. Generate a 6-digit random number to ensure uniqueness
    random_part = random.randint(100000, 999999)  # Random 6-digit number (100000 - 999999)

    # 4. Optionally include product_id (if provided) to increase uniqueness
    # product_part = str(product_id).zfill(3)[-3:] if product_id else ''

    # 5. Combine all parts to form a fixed-length barcode
    barcode = f"{name_hash}{timestamp}{random_part}"

    # Log the generated barcode for testing/debugging
    # print(f"Generated Barcode: {barcode}")

    return barcode


if __name__ == "__main__":
    xlsx_file_path = r'C:/pos-backend/utils/SM Stock.xlsx'
    engine = get_db_engine()
    #print(engine)
    #print(generate_barcode_text('Navy-Blue-Linen-Wear-L'))

    load_xlsx_to_postgres(xlsx_file_path, engine)