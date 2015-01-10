module Drive
  require 'current_user'

  class DiscetteController < ::ApplicationController
    # if I inherit from my own App controller as below, I lose the useful helpers from discourse (such as current_user) in templates
    # Drive::ApplicationController
    include CurrentUser

    skip_before_filter :verify_authenticity_token, only: [:enter]

    skip_before_filter :set_current_user_for_logs
    skip_before_filter :set_locale
    skip_before_filter :set_mobile_view
    skip_before_filter :inject_preview_style
    skip_before_filter :disable_customization
    skip_before_filter :block_if_readonly_mode
    skip_before_filter :authorize_mini_profiler
    skip_before_filter :preload_json
    skip_before_filter :check_xhr
    # skip_before_filter :redirect_to_login_if_required


    # before_action :get_section_from_subdomain
    # before_filter :preload_drive_data

    # below check seems to redirect to main domain if user not authenticated
    # before_action :ensure_logged_in, only: [:claim_section]


    # This method just redirects to a given url.
    # It's used when an ajax login was successful but we want the browser to see
    # a post of a login form so that it offers to remember your password.
    def enter
      params.delete(:username)
      params.delete(:password)

      destination = "/"
      if params[:redirect].present?
        destination = params[:redirect]
      end

      # if params[:redirect].present? && !params[:redirect].match(login_path)
      #   begin
      #     forum_uri = URI(Discourse.base_url)
      #     uri = URI(params[:redirect])
      #     if uri.path.present? &&
      #         (uri.host.blank? || uri.host == forum_uri.host) &&
      #         uri.path !~ /\./
      #       destination = uri.path
      #     end
      #   rescue URI::InvalidURIError
      #     # Do nothing if the URI is invalid
      #   end
      # end

      redirect_to destination
    end

    # end point for routes that are only implemented client side
    # hardly gets hit though...
    # TODO - render useful serverside content for search engine etc..
    def landing
      @subdomain = request.subdomain.downcase || "example"

      # TODO - check discette list

      unless (%w(oporto lisbon berlin madrid madrid2 example birmingham discette ed).include? @subdomain.downcase)
        @subdomain = "example"
      end
      # category = Category.where(:name_lower => subdomain).first
      # if category

      #   discette_topics = category.topics.where("visible")
      #   about_topic = category.topic

      #   geo_topic_list_serialized = serialize_data(discette_topics, Drive::DiscetteTopicItemSerializer)

      #   store_preloaded("discette_topics", geo_topic_list_serialized.to_json)
      #   store_preloaded("about_topic", about_topic.to_json)
      #   store_preloaded("category", category.to_json)
      # end

      store_preloaded("siteSettings", SiteSetting.client_settings_json)
      if current_user
        store_preloaded("currentUser", MultiJson.dump(CurrentUserSerializer.new(current_user, scope: guardian, root: false)))
      end

      render layout: "drive"
    end



    def discette_topics
      subdomain = request.subdomain.downcase
      category = Category.where(:name_lower => subdomain).first
      unless category
        return  render json: { category_flag: 'unclaimed'}
      end
      discette_topics = category.topics.where("deleted_at" => nil).where("visible").where("archetype" => "discette")
      about_topic = category.topic
      # discette_topics =  Topic.where("deleted_at" => nil)
      # .where("visible")
      # .where("archetype <> ?", Archetype.private_message)
      # .where(:category_id => category.id)
      # # .limit(10)

      geo_topic_list_serialized = serialize_data(discette_topics, Drive::DiscetteTopicItemSerializer)

      # render_serialized(geo_topic_list, MapTopic::LocationTopicListSerializer,  root: 'geo_topic_list')
      return render_json_dump({
                                "discette_topics" => geo_topic_list_serialized,
                                "about_topic" => about_topic.as_json,
                                "category" => category.as_json
      })

    end



    def preload_drive_data
      store_preloaded("site", Site.json_for(guardian))
      store_preloaded("siteSettings", SiteSetting.client_settings_json)
      store_preloaded("customHTML", custom_html_json)
      store_preloaded("banner", banner_json)
    end



    def store_preloaded(key, json)
      @preloaded ||= {}
      # I dislike that there is a gsub as opposed to a gsub!
      #  but we can not be mucking with user input, I wonder if there is a way
      #  to inject this safty deeper in the library or even in AM serializer
      @preloaded[key] = json.gsub("</", "<\\/")
    end

  end
end
