import streamlit as st
import pandas as pd
from sqlalchemy import create_engine

from dotenv import load_dotenv
from dotenv import load_dotenv
import os
from st_aggrid import AgGrid
from datetime import date
from datetime import datetime
import altair as alt


# Load environment variables from .env file
load_dotenv()

# Read database credentials from environment variables
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

# Set page layout to wide mode (use full screen)
st.set_page_config(layout="wide")


# Function to connect to PostgreSQL database
# Function to create a SQLAlchemy engine
def get_db_engine():
    db_url = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    engine = create_engine(db_url)
    return engine

# Function to fetch sales summary data
def fetch_sales_summary():
    query = """
        SELECT DATE(sale_date) as Date, COUNT(*) as TotalSalesCount, sum(total) as TotalSales  
        FROM public.sales 
        WHERE sale_date >= CURRENT_DATE - INTERVAL '5 days'  -- Filter for the last 5 days
        GROUP BY 1 
        ORDER BY 1 DESC;
    """
    engine = get_db_engine()
    if engine:
        df = pd.read_sql(query, engine)
        df.columns = ["Date", "Total Sales Count", "Total Sales"]
        #df["Total Sales"] = df["Total Sales"].apply(lambda x: f"£{x:.2f}")  # Formatting with £ symbol
        return df
    return None


# Function to fetch detailed product sales data
def fetch_product_sales():
    query = """
        SELECT DATE(s.sale_date) as Date, p.item_name as ProductName, pv.sku, pv.size, COUNT(*) as SalesCount
        FROM public.sales s
        INNER JOIN saleitems si ON s.id = si.sale_id
        INNER JOIN productvariants pv ON si.product_variant_id = pv.id
        INNER JOIN product p ON pv.product_id = p.id
        WHERE DATE(sale_date) = CURRENT_DATE
        GROUP BY Date, ProductName, sku, size
        ORDER BY Date DESC, SalesCount DESC;
    """
    engine = get_db_engine()
    if engine:
        df = pd.read_sql(query, engine)
        df.columns = ["Date", "Product Name", "SKU", "Size", "Sales Count"]
        df["Date"] = pd.to_datetime(df["Date"]).dt.date
        return df
    return None

def best_selling_product():
    query = """
            SELECT  p.id as productID, p.item_name as ProductName , count(*) -- DATE(sale_date) as Date, s.id, p.id as productID, p.item_name as ProductName
            FROM public.sales s
            INNER JOIN
            public.saleitems si on s.id = si.sale_id
            INNER JOIN
            public.productvariants pv on si.product_variant_id = pv.id
            INNER JOIN 
            public.product p on pv.product_id = p.id
            WHERE DATE(sale_date) = CURRENT_DATE
            GROUP BY 1,2
            order by count(*) desc; 
            """
    
    engine = get_db_engine()
    if engine:
        df = pd.read_sql(query, engine)
        df.columns = ["Product ID", "ProductName", "Product Count"]
        return df
    return None


def calculate_sales_stats(sales_summary_df, col_name):
    today = date.today()
    yesterday = today - pd.Timedelta(days=1)
    todays_sales_df = sales_summary_df[sales_summary_df["Date"] == today]
    yesterdays_sales_df = sales_summary_df[sales_summary_df["Date"] == yesterday]
    if todays_sales_df.empty:
        todays_sales = 0
        
        #percentage_change = "NA"
    else:
        todays_sales = todays_sales_df[col_name].values[0]
    if yesterdays_sales_df.empty:
        yesterdays_sales = 0
        percentage_change = "NA"
    else:
        yesterdays_sales = yesterdays_sales_df[col_name].values[0]
        #if col_name == "Total Sales Count":
        
        percentage_change = ((todays_sales - yesterdays_sales) / yesterdays_sales) * 100
        # else:
        #     'here'
        #     percentage_change = ((float(todays_sales[1:]) - float(yesterdays_sales[1:])) / float(yesterdays_sales[1:])) * 100
    return todays_sales, percentage_change


# Main function
def main():
    st.title("📊 Style Mantra Sales Dashboard")

    sales_summary_df = fetch_sales_summary()
    product_sales_df = fetch_product_sales()

    # Create a container for better positioning
    with st.container():
        # Use markdown with CSS to remove unnecessary padding
        st.markdown(
            """
            <style>
                .css-18e3th9 { padding-top: 0rem; }
                .css-1d391kg { padding-top: 0rem; }
                .css-1aumxhk { padding: 0px; }
            </style>
            """,
            unsafe_allow_html=True,
        )

        # **First Row: KPI Cards (Metrics)**
        col_kpi1, col_kpi2, col_kpi3 = st.columns([1, 1, 2])  # 3 equal KPI sections

        with col_kpi1:       
            if sales_summary_df is not None:
                todays_sales, percentage_change = calculate_sales_stats(sales_summary_df, "Total Sales Count")      
                
            st.metric(label="🛒 Total Number of Sales Today", value=todays_sales, delta=str(percentage_change) + "%")
           
        with col_kpi2:
            if sales_summary_df is not None:
                todays_sales, percentage_change = calculate_sales_stats(sales_summary_df, "Total Sales")
            
            st.metric(label="💰 Sales Today (£)", value=f"£{todays_sales:.2f}", delta=str(percentage_change) + "%")

        with col_kpi3:
            best_selling_product_df = best_selling_product()
            if best_selling_product_df.empty:
                st.metric(label="📦 Best Selling Product", value="No sales today")
            else:
                best_product_name = best_selling_product_df.iloc[0,:]["ProductName"]
                best_product_name_count = best_selling_product_df.iloc[0,:]["Product Count"]
                st.metric(label="📦 Best Selling Product", value=f"{best_product_name} ({best_product_name_count} sold)")
          

        st.markdown("---")  # Divider for better spacing

        # **Second Row: Sales Summary & Product Sales Table**
        col1, col2 = st.columns([2, 3])  # Wider product sales table

        # **Sales Summary Table & Chart**
        with col1:
            st.subheader("📈 Sales Summary")
            if sales_summary_df is not None:
                
                sales_summary_df["Date"] = pd.to_datetime(sales_summary_df["Date"]).dt.date
                sales_summary_df["Total Sales"] = sales_summary_df["Total Sales"].apply(lambda x: f"£{x:.2f}")  # Formatting with £ symbol
                # Interactive AgGrid table
                sales_summary_df
            else:
                st.error("Failed to load sales summary data!")
           
        # **Product Sales Table**
        with col2:
            st.subheader("📦 Product Sales Breakdown")
            if product_sales_df is not None:
                    product_sales_df,  
            else:
                st.error("Failed to load product sales data!")
        

        st.markdown("---")  # Divider for better spacing

        # **Third Row: Future Insights / Graphs**
        # col_chart1, col_chart2 = st.columns([1, 1])  # Two equal width charts

        # with col_chart1:
        #     st.subheader("📊 Sales by Product Category")
        #     # Placeholder for a bar chart (future)
        #     st.bar_chart(data={"Category": ["Coffee", "Tea", "Snacks"], "Sales": [500, 300, 200]})

        # with col_chart2:
        #     st.subheader("📉 Sales Performance Over Time")
        #     # Placeholder for a line chart (future)
        #     st.line_chart(data={"Day": ["Mon", "Tue", "Wed", "Thu"], "Sales": [200, 400, 600, 500]})


       
        st.subheader("📉 Sales Performance Over Time")

        
        sales_summary_df.Date = pd.to_datetime(sales_summary_df.Date)
        sales_summary_df["Total Sales"] = sales_summary_df["Total Sales"].apply(lambda x: float(x[1:]))

        # Create a new column with formatted values (£ and 2 decimal places)
        sales_summary_df["Formatted Sales"] = sales_summary_df["Total Sales"].apply(lambda x: f"£{x:,.2f}")

         # Create an Altair chart with Y-axis control
        line_chart = (
            alt.Chart(sales_summary_df) 
            .mark_line(point=True)  # Line chart with points
            .encode
            (
                x=alt.X("Date", title="Date", 
                        axis=alt.Axis(
                                    format="%a %d",  # 👈 Show only day and date (e.g., "Wed 19")
                                    labelAngle=0,  # 👈 Keep labels horizontal
                                    ticks=True,  # 👈 Ensure only distinct ticks are shown
                                    tickCount="day"  # 👈 Force only one tick per day
                                ) # 👈 Custom X-axis
            ), # 👈 Shows only "Wed 19", "Thu 20", etc),  # Ensure date format

                y=alt.Y("Total Sales", title="Total Sales (£)", scale=alt.Scale(domain=[0, sales_summary_df["Total Sales"].max() + 10])),  # Adjust Y-axis
                tooltip=["Date", "Formatted Sales"],
            )
            .properties(width="container", height=400)  # Full width
            .interactive()  # Make the chart interactive
        )

  
       # Add text labels to each point
        text_labels = line_chart.mark_text(
            align='left',
            baseline='middle',
            dx=-5,  # Adjust the horizontal offset of the labels
            dy=-10,  # Adjust the vertical offset of the labels
            size=15  # Increase text size (default is usually 10)
        ).encode(
            text=alt.Text("Formatted Sales")  # Format as £ and 2 decimal places
        )

        # Combine the line chart and text labels
        final_chart = line_chart + text_labels

      

        # Display the final chart in Streamlit
        st.altair_chart(final_chart, use_container_width=True)








        

if __name__ == "__main__":
    main()
