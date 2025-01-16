import requests
import logging
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry
import json
import datetime

# Setup logging
logging.basicConfig(
    level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s"
)

# Constants
API_URL = "https://visualiser-xhjh.onrender.com/api/hex-results/latest"  # Updated endpoint

# Define the metadata structure
METADATA = {
    "status": "success",
    "timestamp": None,  # Will be set when sending
    "source": "hex_report"
}

def validate_dataframe(df):
    required_fields = [
        'total_blocks', 'total_pages', 'unique_block_types',
        'max_depth', 'avg_depth', 'median_depth', 'max_page_depth',
        'page_count', 'text_block_count', 'todo_count', 'header_count',
        'callout_count', 'toggle_count', 'orphaned_blocks', 'leaf_blocks'
    ]
    
    if df.empty:
        logging.error("DataFrame is empty. Aborting API call.")
        return False
        
    missing_fields = [field for field in required_fields if field not in df.columns]
    if missing_fields:
        logging.error(f"Missing required fields: {missing_fields}")
        return False
        
    logging.info("DataFrame validated successfully.")
    return True

def send_api_request(dataframe):
    try:
        # Validate DataFrame
        if not validate_dataframe(dataframe):
            return

        # Convert DataFrame to JSON
        json_data = dataframe.to_json(orient="records")
        logging.debug(f"Converted DataFrame to JSON: {json_data}")

        # Update metadata timestamp
        METADATA["timestamp"] = datetime.datetime.now().isoformat()

        # Prepare data
        data_payload = {
            "data": json.loads(json_data),  # Parse JSON string into a Python dictionary
            "metadata": METADATA,
            "success": True  # Required by the API
        }

        # Log the payload data for debugging
        logging.debug(f"Prepared payload: {data_payload}")

        # Send request
        logging.info("Sending data to API...")
        headers = {
            "Content-Type": "application/json",
        }

        # Log request details
        logging.debug(f"Request URL: {API_URL}")
        logging.debug(f"Request headers: {headers}")
        logging.debug(f"Request body: {json.dumps(data_payload, indent=4)}")

        response = session.post(API_URL, headers=headers, json=data_payload)

        # Log the response
        logging.info(f"Response status code: {response.status_code}")
        if response.status_code == 200:
            response_data = response.json()
            logging.info(f"Response received: {response_data}")
            if response_data.get("success") == True:
                logging.info("Report generated successfully.")
            else:
                logging.warning(f"Unexpected response: {response_data}")
        else:
            logging.error(
                f"Failed with status code {response.status_code}: {response.text}"
            )

    except requests.exceptions.RequestException as e:
        logging.error(f"Error during API call: {e}")
    except Exception as e:
        logging.error(f"Unexpected error: {e}")

# Main execution
if __name__ == "__main__":
    try:
        # Add missing imports
        import datetime
        
        # Check if the 'dataframe_2' is defined in the Hex environment
        print(dataframe_2)
        data = dataframe_2
        send_api_request(data)
    except Exception as e:
        logging.error(f"Error: {e}")