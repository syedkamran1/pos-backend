import streamlit as st
import pandas as pd
import psycopg2
from dotenv import load_dotenv
import os
from st_aggrid import AgGrid, GridOptionsBuilder

# Load environment variables from .env file
load_dotenv()

# Read database credentials from environment variables
DB_HOST = os.getenv('DB_HOST')
DB_PORT = os.getenv('DB_PORT')
DB_NAME = os.getenv('DB_NAME')
DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD')

# Connect to PostgreSQL database
def connect_to_db():
    try:
        connection = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        print("Connected to the database successfully!")
        return connection
    except Exception as e:
        st.error(f"Error connecting to the database: {e}")
        return None

# Main function
def main():
    st.title("POS Sales Report")
    # DB_HOST
    # DB_PORT
    # DB_NAME
    # DB_USER
    # DB_PASSWORD


    # Connect to the database
    connection = connect_to_db()
    if connection:
        # Perform database operations here
        cursor = connection.cursor()
        cursor.execute("SELECT DATE(sale_date) as Date , count(*) as TotalSales FROM public.sales GROUP BY 1 ORDER BY 1 Desc;")
        sales_data = cursor.fetchall()
        cursor.close()
        connection.close()

        # Display sales data
        # Create DataFrame with column names
        df = pd.DataFrame(sales_data, columns=['Date', 'Total Sales'])
        df['Date'] = pd.to_datetime(df['Date']).dt.date
        df.dtypes
        grid_return = AgGrid(df)



         
    else:
        st.error("Failed to connect to the database!")

if __name__ == "__main__":
    main()