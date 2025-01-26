import requests
import json
import logging
import datetime

def send_api_request(dataframe_2, dataframe_3, workspace_id):
    try:
        # Validate DataFrames
        if not (validate_dataframe(dataframe_2, "dataframe_2") and 
                validate_dataframe(dataframe_3, "dataframe_3")):
            return

        # Log DataFrame columns and sample data
        for df_name, df in [("dataframe_2", dataframe_2), ("dataframe_3", dataframe_3)]:
            logging.info(f"{df_name} columns: {df.columns.tolist()}")
            logging.info(f"{df_name} sample:\n{df.head()}")

        # Convert dataframe_2 to JSON array
        json_data_2 = dataframe_to_json(dataframe_2)

        # Convert dataframe_3 to a single object (assuming it's a single row)
        if len(dataframe_3) > 0:
            metrics_dict = dataframe_3.iloc[0].to_dict()
            # Convert all numeric values to numbers
            metrics_dict = {k: float(v) if isinstance(v, (int, float)) else v 
                          for k, v in metrics_dict.items()}
        else:
            metrics_dict = {}

        # Update metadata timestamp
        METADATA["timestamp"] = datetime.datetime.now().isoformat()

        # Prepare data payload with dataframes and workspaceId
        data_payload = {
            "workspaceId": workspace_id.strip(),  # Include workspaceId in the payload
            "data": {
                "dataframe_2": json.loads(json_data_2),
                "dataframe_3": metrics_dict
            },
            "metadata": METADATA,
            "success": True
        }

        # Log the payload data for debugging
        logging.info(f"Sending payload with {len(data_payload['data']['dataframe_2'])} records in dataframe_2")
        logging.info(f"Sending payload with {len(metrics_dict)} metrics in dataframe_3")
        logging.info(f"Workspace ID: {data_payload['workspaceId']}")
        logging.info(f"First record samples:")
        logging.info(f"dataframe_2: {data_payload['data']['dataframe_2'][0] if data_payload['data']['dataframe_2'] else 'No data'}")
        logging.info(f"dataframe_3: {metrics_dict}")
        logging.info(f"Metadata: {data_payload['metadata']}")

        # Send request
        logging.info(f"Sending data to API at {API_URL}...")
        headers = {"Content-Type": "application/json"}
        response = session.post(API_URL, headers=headers, json=data_payload)

        # Log the response
        logging.info(f"Response status code: {response.status_code}")
        logging.info(f"Response headers: {dict(response.headers)}")
        try:
            response_data = response.json()
            logging.info(f"Response received: {response_data}")
            if response_data.get("success"):
                logging.info("Report generated successfully.")
            else:
                logging.warning(f"Unexpected response: {response_data}")
        except Exception as e:
            logging.error(f"Error parsing response JSON: {e}")
            logging.error(f"Raw response text: {response.text}")

        if response.status_code != 200:
            logging.error(f"Failed with status code {response.status_code}: {response.text}")

    except requests.exceptions.RequestException as e:
        logging.error(f"Error during API call: {e}")
    except Exception as e:
        logging.error(f"Unexpected error: {e}")

# Main execution
if __name__ == "__main__":
    try:
        # The dataframe_2 and workspace_id from SQL query will be available in Hex
        logging.info("Starting script execution")
        logging.info(f"DataFrame info:\n{dataframe_2.info()}")
        print(dataframe_2)
        send_api_request(dataframe_2, dataframe_3, _input_text)  # _input_text is the workspace_id from Hex
    except Exception as e:
        logging.error(f"Error: {e}") 