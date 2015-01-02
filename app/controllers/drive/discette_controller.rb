module Drive
require 'current_user'

  class DiscetteController < ApplicationController
    # if I inherit from my own App controller as below, I lose the useful helpers from discourse (such as current_user) in templates
    # Drive::ApplicationController
    include CurrentUser
    # before_action :get_section_from_subdomain
    # before_filter :preload_drive_data

    # below check seems to redirect to main domain if user not authenticated
    # before_action :ensure_logged_in, only: [:claim_section]

    # end point for routes that are only implemented client side
    # hardly gets hit though...
    # TODO - render useful serverside content for search engine etc..
    def landing
      # binding.pryß

      store_preloaded("siteSettings", SiteSetting.client_settings_json)

      render layout: "drive"
      # subdomain = request.subdomain
      # render json: { status: 'ok', subdomain: subdomain}
      # head 200, content_type: "text/html", layout: "drive"
    end



    def discette_topics
      subdomain = request.subdomain.downcase
      category = Category.where(:name_lower => subdomain).first
      unless category
        return  render json: { category_flag: 'unclaimed'}
      end
      discette_topics = category.topics.where("visible")
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
