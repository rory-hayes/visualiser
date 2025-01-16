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
API_URL = "https://visualiser-xhjh.onrender.com/api/hex-results/latest"

# Define metadata structure
METADATA = {
    "status": "success",
    "timestamp": None,  # Will be set when sending
    "source": "hex_report"
}

# Setup session with retry strategy
session = requests.Session()
retry_strategy = Retry(
    total=3,
    backoff_factor=1,
    status_forcelist=[429, 500, 502, 503, 504],
    allowed_methods=["POST"]
)
session.mount("https://", HTTPAdapter(max_retries=retry_strategy))

def validate_dataframe(df):
    if df.empty:
        logging.error("DataFrame is empty. Aborting API call.")
        return False
    logging.info("DataFrame validated successfully.")
    return True

def dataframe_to_json(df):
    try:
        # Keep original column names, don't convert to lowercase
        json_data = df.to_json(orient="records")
        logging.info("DataFrame converted to JSON successfully.")
        return json_data
    except Exception as e:
        logging.error(f"Error converting DataFrame to JSON: {e}")
        raise

def send_api_request(dataframe):
    try:
        # Validate DataFrame
        if not validate_dataframe(dataframe):
            return

        # Convert DataFrame to JSON
        json_data = dataframe_to_json(dataframe)
        logging.debug(f"Converted DataFrame to JSON: {json_data}")

        # Update metadata timestamp
        METADATA["timestamp"] = datetime.datetime.now().isoformat()

        # Prepare data payload
        data_payload = {
            "data": json.loads(json_data),
            "metadata": METADATA,
            "success": True
        }

        # Log the payload data for debugging
        logging.debug(f"Prepared payload: {data_payload}")

        # Send request
        logging.info("Sending data to API...")
        headers = {"Content-Type": "application/json"}
        response = session.post(API_URL, headers=headers, json=data_payload)

        # Log the response
        logging.info(f"Response status code: {response.status_code}")
        if response.status_code == 200:
            response_data = response.json()
            logging.info(f"Response received: {response_data}")
            if response_data.get("success"):
                logging.info("Report generated successfully.")
            else:
                logging.warning(f"Unexpected response: {response_data}")
        else:
            logging.error(f"Failed with status code {response.status_code}: {response.text}")

    except requests.exceptions.RequestException as e:
        logging.error(f"Error during API call: {e}")
    except Exception as e:
        logging.error(f"Unexpected error: {e}")

# Main execution
if __name__ == "__main__":
    try:
        # The dataframe_2 from SQL query will be available in Hex
        print(dataframe_2)
        send_api_request(dataframe_2)
    except Exception as e:
        logging.error(f"Error: {e}")