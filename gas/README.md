# Google Apps Script Setup Guide

## Steps to Deploy

1. Go to [script.google.com](https://script.google.com)
2. Create a new project
3. Copy the contents of `Code.gs` into the editor
4. Click **Deploy > New deployment**
5. Select type: **Web App**
6. Set:
   - Execute as: **Me**
   - Who has access: **Anyone** (or Anyone with Google account)
7. Click **Deploy** and copy the Web App URL
8. Update `src/services/api.js` in the React app with your URL

## Running Setup

After deploying, call `setupSampleData()` function once to add sample data.

## Sheet Structure

### Projects Sheet
| id | name | department | target_revenue | estimated_cost | start_date | end_date | status |

### Transactions Sheet
| id | project_id | type | amount | date | description |