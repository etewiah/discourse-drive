module Drive
  require 'current_user'

  class SectionController < ::ApplicationController
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


    def all
      sections = Drive::Section.all
      discettes = Drive::Discette.all
      sections_serialized = serialize_data(sections, Drive::SectionSerializer)

# temporary workaround : return all categories for section mgmt
      categories = Category.all
      # return render json: sections.as_json, root: false
      return render_json_dump({
                                "sections" => sections_serialized,
                                "discettes" => discettes.as_json,
                                "categories" => categories.as_json
      })
    end

    def create
      new_section = Drive::Section.where(:subdomain_lower => params[:subdomain].downcase).first_or_initialize
      section_discette = Drive::Discette.find(params[:discette][:id])
      section_category = Category.find(params[:category][:id])
      new_section.name = params[:name]
      # new_section.discette_name = params[:discette_name]
      new_section.discette = section_discette
      new_section.category = section_category
      if new_section.save!
        render json: new_section.as_json
      else
        render status: :bad_request, json: {"error" => {"message" => "Error creating section"}}
      end
    end

    def destroy
      section = Drive::Section.find(params[:id])
      if section.destroy!
        render json: { success: 'OK' }
      else
        render status: :bad_request, json: {"error" => {"message" => "Error deleting section"}}        
      end
    end


    # This method just redirects to a given url.
    # It's used when an ajax login was successful but we want the browser to see
    # a post of a login form so that it offers to remember your password.
    # For discette I need to overide it the default discourse implementation assumes
    # everything happens at one root domain.  I want to stay in the same subdomain as I authenticated in
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
      subdomain = request.subdomain.downcase || "default"
      section = Drive::Section.where(:subdomain_lower => subdomain).first
      # if (%w(oporto lisbon berlin madrid madrid2 example birmingham discette ed).include? subdomain.downcase)
      if section && section.discette
        # TODO - add validation to ensure sections always have a discette
        @discette_name = section.discette.slug
      else
        @discette_name = "default"
      end
      # The @discette_name is used by the layout to decide which javascript (effectively which ember app)
      # to use

      store_preloaded("siteSettings", SiteSetting.client_settings_json)
      if current_user
        store_preloaded("currentUser", MultiJson.dump(CurrentUserSerializer.new(current_user, scope: guardian, root: false)))
      end

      render layout: "drive"
    end



    def topics
      subdomain = request.subdomain.downcase
      section = Drive::Section.where(:subdomain_lower => subdomain).first
      # category = Category.where(:name_lower => subdomain).first
      unless section && section.category
        return  render json: { category_flag: 'unclaimed'}
      end
      discette_topics = section.category.topics.where("deleted_at" => nil).where("visible").where("archetype" => "discette")

      geo_topic_list_serialized = serialize_data(discette_topics, Drive::DiscetteTopicItemSerializer)

      # TODO - render serialized section instead of category (need to do this after I update ember app)
      return render_json_dump({
                                "discette_topics" => geo_topic_list_serialized,
                                "category" => section.category.as_json
      })

    end


    def about
      subdomain = request.subdomain.downcase
      section = Drive::Section.where(:subdomain_lower => subdomain).first
      # category = Category.where(:name_lower => subdomain).first
      unless section && section.category
        return  render json: { category_flag: 'unclaimed'}
      end
      about_topic = section.category.topic

      opts = {}
      begin
        @topic_view = TopicView.new(about_topic.id, current_user, opts)
      rescue Discourse::NotFound
        topic = Topic.find_by(slug: params[:id].downcase) if params[:id]
        raise Discourse::NotFound unless topic
        redirect_to_correct_topic(topic, opts[:post_number]) && return
      end

      topic_view_serializer = TopicViewSerializer.new(@topic_view, scope: guardian, root: false, include_raw: !!params[:include_raw])
      return  render_json_dump(topic_view_serializer)
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
