module Drive
  class ApplicationController < ::ApplicationController
    # ActionController::Base

    private

    def get_current_section
      subdomain = request.subdomain.downcase
      section = Drive::Section.where(:subdomain_lower => subdomain).first
      return section
    end

    def ensure_admin
      # render json: MultiJson.dump(create_errors_json("Invalid Access")), status: 401

      render_json_error(current_user) unless current_user && current_user.admin?    
      # raise Discourse::InvalidAccess.new unless current_user.admin?
    end

    def create_category_for_section(subdomain_lower, description)
      # TODO - add validation to Category to prevent creation of multiple categories with same :name_lower
      section_category = Category.where(:name_lower => subdomain_lower).first_or_initialize
      unless section_category.user
        section_category.name = subdomain_lower
        section_category.user_id = current_user.id
        section_category.description = description
        # if params[:is_private]
        #   section_category.read_restricted = true
        # end
      end
      return render_json_error(section_category) unless section_category.save
      section_category.topic.visible = false
      # TODO - less hacky way of getting content from topics
      template_topic_id = SiteSetting.send('guidelines_topic_id')
      template_topic = Topic.find_by_id(template_topic_id)
      default_post = section_category.topic.posts.first
      default_post.raw = template_topic.posts.second.raw
      default_post.save

      return section_category
    end

    def pass_through_request conn, path, errorMessage = "Sorry, there has been an error"
      response = conn.get path
      rb = response.body
      if response.status == 200
        return render json: response.body
      else
        return render_json_error(errorMessage)
        # render json: {"error" => {"message" => "sorry, there has been an error"}}
      end
    end

    # https://github.com/discourse/discourse_api/blob/master/lib/discourse_api/client.rb
    def get_connection url
      # @connection ||= Faraday.new connection_options do |conn|
      faraday_connection = Faraday.new(:url => url) do |conn|
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
      return faraday_connection
    end


  end
end
