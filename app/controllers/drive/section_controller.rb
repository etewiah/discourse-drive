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
                                # "categories" => categories.as_json
      })
    end

    def create
      return render_json_error('unauthenticated') unless current_user
      #
      if params[:subdomain]
        subdomain_lower = params[:subdomain].downcase
      else
        subdomain_lower = request.subdomain.downcase
      end

      section_category = create_category_for_section subdomain_lower, params[:description]

      new_section = Drive::Section.where(:subdomain_lower => subdomain_lower).first_or_initialize
      if params[:discette]
        section_discette = Drive::Discette.find(params[:discette][:id])
      else
        # TODO - extract method for retrieving default discette
        section_discette = Drive::Discette.where(:slug => 'default').first
      end

      new_section.name = params[:name]
      new_section.discette = section_discette
      new_section.category = section_category
      return render_json_error(new_section) unless new_section.save

      section_owner = new_section.section_users.where(:user_id => current_user.id).first_or_initialize

      # TODO - use flag tzu for below:
      section_owner.role = "owner"
      section_owner.save!

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
    # TODO - render useful serverside content for search engine etc..
    def landing
      root_url = Rails.env.development? ? "http://lvh.me:3000" : "http:klavado.com"
      assets_base_url = Rails.env.development? ? "" : "http:klavado.com"

      subdomain_lower = request.subdomain.downcase || "default"
      section = Drive::Section.where(:subdomain_lower => subdomain_lower).first
      # if (%w(oporto lisbon berlin madrid madrid2 example birmingham discette ed).include? subdomain.downcase)
      if section && section.discette
        current_discette = section.discette
        # TODO - add validation to ensure sections always have a discette
        current_section = section.as_json
      else
        current_discette = Drive::Discette.where(:slug => "default").first
        current_section = {name: "Unknown", status: "unclaimed", subdomain_lower: subdomain_lower}
      end

      @discette_css_files = []
      current_discette.meta["files"]["css"].each do |css_file|
        css_file_with_path = "#{assets_base_url}/plugins/Drive/drives/#{current_discette.slug}/assets/#{css_file}" 
        @discette_css_files.push css_file_with_path
      end

      @discette_js_files = []
      current_discette.meta["files"]["js"].each do |js_file|
        js_file_with_path = "#{assets_base_url}/plugins/Drive/drives/#{current_discette.slug}/assets/#{js_file}" 
        # This is quite fragile at the moment as it only works for js files named exactly as my discette-template
        # files at the moment.  If the way the files should be ordered or named changes, the files may get 
        # loaded in the wrong order
        @discette_js_files.unshift js_file_with_path
      end
      # [
      #   "/plugins/Drive/drives/" + current_discette.slug + "/vendor.css",
      #   "/plugins/Drive/drives/" + current_discette.slug + "/discette.css"
      # ]

      current_section["root_url"] = root_url
      # TODO - remove below after fixing in client app
      current_section["rootUrl"] = root_url

      store_preloaded("currentSection", current_section.to_json)
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
        return  render json: { section_status: 'unclaimed'}
      end
      discette_topics = section.category.topics.where("deleted_at" => nil).where("archetype" => "discette")

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
        return  render json: { section_status: 'unclaimed'}
      end
      about_topic = section.category.topic

      opts = {
        suggested_topics: []
      }
      begin
        @topic_view = TopicView.new(about_topic.id, current_user, opts)
      rescue Discourse::NotFound
        topic = Topic.find_by(slug: params[:id].downcase) if params[:id]
        raise Discourse::NotFound unless topic
        redirect_to_correct_topic(topic, opts[:post_number]) && return
      end

      topic_view_serializer = TopicViewSerializer.new(@topic_view, scope: guardian, root: false, include_raw: true)
      section_serialized = serialize_data(section, Drive::SectionSerializer, root: false)

      return  render_json_dump({
                                 "section" => section_serialized,
                                 "topic" => topic_view_serializer
      })
    end

    def current
      subdomain = request.subdomain.downcase
      section = Drive::Section.where(:subdomain_lower => subdomain).first
      # category = Category.where(:name_lower => subdomain).first
      unless section && section.category
        return  render json: { section_status: 'unclaimed'}
      end

      # topic_view_serializer = TopicViewSerializer.new(@topic_view, scope: guardian, root: false, include_raw: !!params[:include_raw])

      section_serialized = serialize_data(section, Drive::SectionSerializer)
      return  render_json_dump(section_serialized)
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

    private

    def create_category_for_section(subdomain_lower, description)
      # TODO - add validation to Category to prevent creation of multiple categories with same :name_lower
      section_category = Category.where(:name_lower => subdomain_lower).first_or_initialize
      unless section_category.user
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




  end
end
