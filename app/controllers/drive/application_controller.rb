module Drive
  class ApplicationController < ::ApplicationController
    # ActionController::Base

    private

    def ensure_admin
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

  end
end
