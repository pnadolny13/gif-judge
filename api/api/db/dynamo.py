import os

import boto3
import botocore
from boto3.dynamodb.conditions import Key


class DynamoDB:
    
    def __init__(self):
        self.dynamodb = self._get_session().resource('dynamodb')

    def _get_session(self):
        return boto3.Session(
            aws_access_key_id=os.environ["AWS_ACCESS"],
            aws_secret_access_key=os.environ["AWS_SECRET"],
            region_name="us-east-1"
        )

    def put_item(self, table_name: str, content: dict):
        table = self.dynamodb.Table(table_name)      
        return table.put_item(Item=content)

    def get_item(self, table_name: str, filter: dict):
        table = self.dynamodb.Table(table_name)      
        resp = table.get_item(Key=filter)
        if 'Item' in resp:
            return resp['Item']

    def get_items(self, table_name: str, scan_kwargs: dict):
        table = self.dynamodb.Table(table_name)   
        resp = table.scan(**scan_kwargs)
        complete = False
        records = []
        while not complete:
            try:
                response = table.scan(**scan_kwargs)
            except botocore.exceptions.ClientError as error:
                raise Exception('Error quering DB: {}'.format(error))

            records.extend(response.get('Items', []))
            next_key = response.get('LastEvaluatedKey')
            scan_kwargs['ExclusiveStartKey'] = next_key

            complete = True if next_key is None else False
        return records

    def update_item(self, table_name: str, key: dict, expression: str, attrb_vals: dict, attrb_names: dict = None):
        table = self.dynamodb.Table(table_name)
        params = {
            'Key': key,
            'UpdateExpression': expression,
            'ExpressionAttributeValues': attrb_vals,
            'ReturnValues': "ALL_NEW"
        }
        if attrb_names:
            params['ExpressionAttributeNames'] = attrb_names
        
        resp = table.update_item(**params)
        return resp
