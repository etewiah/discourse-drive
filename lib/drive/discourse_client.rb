# http://blog.rlmflores.me/blog/2013/07/16/ruby-patterns-webservice-object/
module Drive
  class DiscourseClient
    def initialize(url)
      @url = url
    end

    def latest_topics
      # path = "/latest.json"
      # pass_through_request path
      return connection.get "/latest.json"
    end


    def site_info
      # conn = connection
      about_response = connection.get '/about.json'
      rb = about_response.body
      if about_response.status == 200
        about_json = (JSON.parse about_response.body)['about']
        
        # below includes trailing slash
        host_url = connection.url_prefix.to_s.downcase
        hostname = connection.url_prefix.hostname.downcase
        about_json['slug'] = hostname.gsub( ".","_")
        about_json['host_url'] = host_url

        # not entirely sure if below is worth doing just for icons....
        root_response = connection.get '/'
        page = Nokogiri::HTML(root_response.body)
        favicon_url = page.css('link[rel="icon"]')[0].attributes['href'].value rescue nil
        about_json['favicon_url'] = favicon_url
        apple_touch_icon_url = page.css('link[rel="apple-touch-icon"]')[0].attributes['href'].value rescue nil
        about_json['apple_touch_icon_url'] = apple_touch_icon_url
        return about_json
      else
        return {"error" => {"message" => "sorry, there has been an error"}}
      end
    end


    private

    # def pass_through_request path
    #   response = connection.get path
    #   return response
    # end


    # https://github.com/discourse/discourse_api/blob/master/lib/discourse_api/client.rb
    def connection
      # @connection ||= Faraday.new connection_options do |conn|
      @faraday_connection ||= Faraday.new(:url => @url) do |conn|
        # Follow redirects
        # conn.use FaradayMiddleware::FollowRedirects, limit: 5
        conn.response :logger                  # log requests to STDOUT
        # Convert request params to "www-form-encoded"
        conn.request :url_encoded
        # Parse responses as JSON
        # conn.use FaradayMiddleware::ParseJson, content_type: 'application/json'
        # Use Faraday's default HTTP adapter
        conn.adapter Faraday.default_adapter
        #pass api_key and api_username on every request
        # conn.params['api_key'] = api_key
        # conn.params['api_username'] = api_username
      end
      return @faraday_connection
    end

  end
end
