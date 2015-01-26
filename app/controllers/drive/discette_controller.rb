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


    def all
      discettes = Drive::Discette.all
      return render json: discettes.as_json, root: false
    end

    # def create
    #   # binding.pry
    #   new_discette = Drive::Discette.where(:slug => params[:slug].downcase).first_or_initialize
    #   new_discette.name = params[:name]
    #   new_discette.description = params[:description]
    #   if new_discette.save!
    #     render json: new_discette.as_json
    #   else
    #     render status: :bad_request, json: {"error" => {"message" => "Error creating discette"}}
    #   end
    # end



    # def discette_topics
    #   # TODO - allow category for subdomain to be configurable
    #   subdomain = request.subdomain.downcase
    #   category = Category.where(:name_lower => subdomain).first
    #   unless category
    #     return  render json: { category_flag: 'unclaimed'}
    #   end
    #   discette_topics = category.topics.where("deleted_at" => nil).where("visible").where("archetype" => "discette")
    #   # about_topic = category.topic

    #   geo_topic_list_serialized = serialize_data(discette_topics, Drive::DiscetteTopicItemSerializer)

    #   # render_serialized(geo_topic_list, MapTopic::LocationTopicListSerializer,  root: 'geo_topic_list')
    #   return render_json_dump({
    #                             "discette_topics" => geo_topic_list_serialized,
    #                             # "about_topic" => about_topic.as_json,
    #                             "category" => category.as_json
    #   })

    # end


    # def discette_about
    #   # TODO - allow category for subdomain to be configurable
    #   subdomain = request.subdomain.downcase
    #   category = Category.where(:name_lower => subdomain).first
    #   unless category
    #     return  render json: { category_flag: 'unclaimed'}
    #   end
    #   about_topic = category.topic

    #   opts = {}
    #   begin
    #     @topic_view = TopicView.new(about_topic.id, current_user, opts)
    #   rescue Discourse::NotFound
    #     topic = Topic.find_by(slug: params[:id].downcase) if params[:id]
    #     raise Discourse::NotFound unless topic
    #     redirect_to_correct_topic(topic, opts[:post_number]) && return
    #   end

    #   topic_view_serializer = TopicViewSerializer.new(@topic_view, scope: guardian, root: false, include_raw: !!params[:include_raw])
    #   return  render_json_dump(topic_view_serializer)
    # end




    # def preload_drive_data
    #   store_preloaded("site", Site.json_for(guardian))
    #   store_preloaded("siteSettings", SiteSetting.client_settings_json)
    #   store_preloaded("customHTML", custom_html_json)
    #   store_preloaded("banner", banner_json)
    # end



    # def store_preloaded(key, json)
    #   @preloaded ||= {}
    #   # I dislike that there is a gsub as opposed to a gsub!
    #   #  but we can not be mucking with user input, I wonder if there is a way
    #   #  to inject this safty deeper in the library or even in AM serializer
    #   @preloaded[key] = json.gsub("</", "<\\/")
    # end

  end
end
