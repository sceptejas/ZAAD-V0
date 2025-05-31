#!/usr/bin/env python3
"""
YouTube Studio Revenue Data Scraper

This script automates the process of extracting revenue data for specific videos
from YouTube Studio using Selenium WebDriver.

Requirements:
- selenium
- pandas
- webdriver-manager
- time
- csv

Install dependencies:
pip install selenium pandas webdriver-manager
"""

import time
import csv
import json
from datetime import datetime, timedelta
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
import pandas as pd

class YouTubeStudioScraper:
    def _init_(self, headless=False):
        """Initialize the scraper with Chrome WebDriver"""
        self.driver = None
        self.wait = None
        self.setup_driver(headless)
    
    def setup_driver(self, headless=False):
        """Setup Chrome WebDriver with appropriate options"""
        chrome_options = Options()
        if headless:
            chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        self.wait = WebDriverWait(self.driver, 20)
    
    def login_to_youtube_studio(self):
        """Navigate to YouTube Studio and handle login"""
        print("Navigating to YouTube Studio...")
        self.driver.get("https://studio.youtube.com")
        
        print("Please log in to your YouTube account manually in the browser window.")
        print("Once logged in and you can see the YouTube Studio dashboard, press Enter to continue...")
        input()
        
        # Wait for the dashboard to load
        try:
            self.wait.until(EC.presence_of_element_located((By.ID, "channel-dashboard")))
            print("Successfully logged into YouTube Studio!")
        except TimeoutException:
            print("Login verification failed. Please ensure you're logged in and try again.")
            return False
        
        return True
    
    def navigate_to_analytics(self):
        """Navigate to the Analytics section"""
        try:
            # Click on Analytics menu item
            analytics_link = self.wait.until(
                EC.element_to_be_clickable((By.XPATH, "//a[@href='/channel/analytics']"))
            )
            analytics_link.click()
            
            # Wait for analytics page to load
            self.wait.until(EC.presence_of_element_located((By.ID, "analytics-header")))
            print("Successfully navigated to Analytics section")
            return True
            
        except TimeoutException:
            print("Failed to navigate to Analytics section")
            return False
    
    def set_date_range(self, start_date, end_date):
        """Set custom date range for analytics data"""
        try:
            # Click on date picker
            date_picker = self.wait.until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-title='Select date range']"))
            )
            date_picker.click()
            
            # Select custom range
            custom_option = self.wait.until(
                EC.element_to_be_clickable((By.XPATH, "//div[text()='Custom']"))
            )
            custom_option.click()
            
            # Set start date
            start_input = self.driver.find_element(By.CSS_SELECTOR, "input[aria-label='Start date']")
            start_input.clear()
            start_input.send_keys(start_date.strftime("%m/%d/%Y"))
            
            # Set end date
            end_input = self.driver.find_element(By.CSS_SELECTOR, "input[aria-label='End date']")
            end_input.clear()
            end_input.send_keys(end_date.strftime("%m/%d/%Y"))
            
            # Apply date range
            apply_button = self.driver.find_element(By.XPATH, "//button[text()='Apply']")
            apply_button.click()
            
            time.sleep(3)  # Wait for data to refresh
            return True
            
        except (TimeoutException, NoSuchElementException) as e:
            print(f"Failed to set date range: {e}")
            return False
    
    def navigate_to_content_tab(self):
        """Navigate to Content tab to view individual videos"""
        try:
            # Click on Content tab
            content_tab = self.wait.until(
                EC.element_to_be_clickable((By.XPATH, "//a[contains(@href, '/content')]"))
            )
            content_tab.click()
            
            # Wait for content page to load
            self.wait.until(EC.presence_of_element_located((By.ID, "video-list")))
            print("Successfully navigated to Content section")
            return True
            
        except TimeoutException:
            print("Failed to navigate to Content section")
            return False
    
    def get_video_revenue_data(self, video_ids=None, max_videos=None):
        """
        Scrape revenue data for specific videos or all videos
        
        Args:
            video_ids (list): List of specific video IDs to scrape
            max_videos (int): Maximum number of videos to process
        """
        revenue_data = []
        
        try:
            # Get all video rows
            video_rows = self.driver.find_elements(By.CSS_SELECTOR, "[data-video-id]")
            
            if max_videos:
                video_rows = video_rows[:max_videos]
            
            print(f"Found {len(video_rows)} videos to process")
            
            for i, row in enumerate(video_rows):
                try:
                    # Get video ID
                    video_id = row.get_attribute("data-video-id")
                    
                    # Skip if specific video IDs provided and this isn't one of them
                    if video_ids and video_id not in video_ids:
                        continue
                    
                    # Click on the video to open analytics
                    video_link = row.find_element(By.CSS_SELECTOR, "a[data-video-id]")
                    video_title = video_link.get_attribute("aria-label")
                    
                    print(f"Processing video {i+1}: {video_title}")
                    
                    # Click to open video analytics
                    analytics_button = row.find_element(By.CSS_SELECTOR, "[aria-label='Analytics']")
                    analytics_button.click()
                    
                    # Wait for analytics page to load
                    time.sleep(3)
                    
                    # Extract revenue data
                    revenue_info = self.extract_video_revenue_data(video_id, video_title)
                    if revenue_info:
                        revenue_data.append(revenue_info)
                    
                    # Go back to content list
                    self.driver.back()
                    time.sleep(2)
                    
                except Exception as e:
                    print(f"Error processing video {i+1}: {e}")
                    continue
            
            return revenue_data
            
        except Exception as e:
            print(f"Error getting video revenue data: {e}")
            return revenue_data
    
    def extract_video_revenue_data(self, video_id, video_title):
        """Extract revenue data from individual video analytics page"""
        try:
            revenue_data = {
                'video_id': video_id,
                'video_title': video_title,
                'total_revenue': 0,
                'ad_revenue': 0,
                'youtube_premium_revenue': 0,
                'super_chat_revenue': 0,
                'channel_membership_revenue': 0,
                'views': 0,
                'watch_time_hours': 0,
                'rpm': 0,  # Revenue per mille (per 1000 views)
                'cpm': 0,  # Cost per mille
                'date_scraped': datetime.now().isoformat()
            }
            
            # Wait for analytics to load
            self.wait.until(EC.presence_of_element_located((By.ID, "analytics-header")))
            
            # Try to find revenue metrics
            revenue_elements = self.driver.find_elements(
                By.CSS_SELECTOR, 
                "[data-metric-key*='revenue'], [data-metric-key*='earnings']"
            )
            
            for element in revenue_elements:
                metric_key = element.get_attribute("data-metric-key")
                value_text = element.find_element(By.CSS_SELECTOR, ".metric-value").text
                
                # Parse revenue value
                revenue_value = self.parse_revenue_value(value_text)
                
                if "total" in metric_key.lower():
                    revenue_data['total_revenue'] = revenue_value
                elif "ad" in metric_key.lower():
                    revenue_data['ad_revenue'] = revenue_value
                elif "premium" in metric_key.lower():
                    revenue_data['youtube_premium_revenue'] = revenue_value
                elif "super_chat" in metric_key.lower():
                    revenue_data['super_chat_revenue'] = revenue_value
                elif "membership" in metric_key.lower():
                    revenue_data['channel_membership_revenue'] = revenue_value
            
            # Get views and watch time
            try:
                views_element = self.driver.find_element(By.CSS_SELECTOR, "[data-metric-key='views']")
                revenue_data['views'] = self.parse_number_value(
                    views_element.find_element(By.CSS_SELECTOR, ".metric-value").text
                )
            except NoSuchElementException:
                pass
            
            try:
                watch_time_element = self.driver.find_element(By.CSS_SELECTOR, "[data-metric-key='watch_time']")
                revenue_data['watch_time_hours'] = self.parse_time_value(
                    watch_time_element.find_element(By.CSS_SELECTOR, ".metric-value").text
                )
            except NoSuchElementException:
                pass
            
            # Calculate RPM if we have revenue and views
            if revenue_data['total_revenue'] > 0 and revenue_data['views'] > 0:
                revenue_data['rpm'] = (revenue_data['total_revenue'] / revenue_data['views']) * 1000
            
            return revenue_data
            
        except Exception as e:
            print(f"Error extracting revenue data: {e}")
            return None
    
    def parse_revenue_value(self, value_text):
        """Parse revenue value from text (e.g., '$12.34' -> 12.34)"""
        try:
            # Remove currency symbols and commas
            cleaned = value_text.replace('$', '').replace('₹', '').replace(',', '').strip()
            return float(cleaned)
        except ValueError:
            return 0.0
    
    def parse_number_value(self, value_text):
        """Parse number value (handles K, M suffixes)"""
        try:
            value_text = value_text.replace(',', '').strip()
            if 'K' in value_text:
                return float(value_text.replace('K', '')) * 1000
            elif 'M' in value_text:
                return float(value_text.replace('M', '')) * 1000000
            else:
                return float(value_text)
        except ValueError:
            return 0
    
    def parse_time_value(self, time_text):
        """Parse time value to hours"""
        try:
            # Handle formats like "1:23:45" or "45:30" or "1.2K hours"
            if 'hours' in time_text.lower():
                return self.parse_number_value(time_text.replace('hours', '').strip())
            elif ':' in time_text:
                parts = time_text.split(':')
                if len(parts) == 3:  # H:M:S
                    return int(parts[0]) + int(parts[1])/60 + int(parts[2])/3600
                elif len(parts) == 2:  # M:S
                    return int(parts[0])/60 + int(parts[1])/3600
            return 0
        except ValueError:
            return 0
    
    def save_to_csv(self, data, filename=None):
        """Save revenue data to CSV file"""
        if not filename:
            filename = f"youtube_revenue_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        df = pd.DataFrame(data)
        df.to_csv(filename, index=False)
        print(f"Revenue data saved to {filename}")
        return filename
    
    def save_to_json(self, data, filename=None):
        """Save revenue data to JSON file"""
        if not filename:
            filename = f"youtube_revenue_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Revenue data saved to {filename}")
        return filename
    
    def close(self):
        """Close the browser driver"""
        if self.driver:
            self.driver.quit()

def main():
    """Main function to run the scraper"""
    scraper = YouTubeStudioScraper(headless=False)  # Set to True for headless mode
    
    try:
        # Login to YouTube Studio
        if not scraper.login_to_youtube_studio():
            return
        
        # Navigate to content section
        if not scraper.navigate_to_content_tab():
            return
        
        # Set date range (optional)
        start_date = datetime.now() - timedelta(days=30)  # Last 30 days
        end_date = datetime.now()
        scraper.set_date_range(start_date, end_date)
        
        # Scrape revenue data
        # Option 1: Scrape all videos (limited to first 10 for testing)
        revenue_data = scraper.get_video_revenue_data(max_videos=10)
        
        # Option 2: Scrape specific video IDs
        # specific_video_ids = ['VIDEO_ID_1', 'VIDEO_ID_2', 'VIDEO_ID_3']
        # revenue_data = scraper.get_video_revenue_data(video_ids=specific_video_ids)
        
        if revenue_data:
            # Save data
            csv_file = scraper.save_to_csv(revenue_data)
            json_file = scraper.save_to_json(revenue_data)
            
            # Print summary
            total_revenue = sum(video['total_revenue'] for video in revenue_data)
            print(f"\nScraping completed!")
            print(f"Videos processed: {len(revenue_data)}")
            print(f"Total revenue: ${total_revenue:.2f}")
            print(f"Data saved to: {csv_file} and {json_file}")
        else:
            print("No revenue data was scraped.")
    
    except KeyboardInterrupt:
        print("\nScraping interrupted by user.")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        scraper.close()

if _name_ == "_main_":
    main()