module Drive
  require 'current_user'

  class AdminController < Drive::ApplicationController
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


    before_filter :ensure_admin
    # , only: [:destroy]

    def show_section
      section = Drive::Section.find(params[:id])
      section_serialized = serialize_data(section, Drive::SectionSerializer)
      return  render_json_dump(section_serialized)
    end

    def show_discette
      discette = Drive::Discette.find(params[:id])
      discette_serialized = serialize_data(discette, Drive::DetailedDiscetteSerializer, :root => 'discette')
      return  render_json_dump(discette_serialized)
    end

    def destroy_section
      section = Drive::Section.find(params[:id])
      if section.destroy!
        render json: { success: 'OK' }
      else
        return render_json_error('Error deleting section')
      end
    end

    def destroy_discette
      discette = Drive::Discette.find(params[:id])
      if discette.sections && discette.sections.length > 0
        return render_json_error "Cannot delete: discette has sections."
      end
      if discette.destroy!
        render json: { success: 'OK' }
      else
        return render_json_error('Error deleting discette')
      end
    end

    def create_discette
      new_discette = Drive::Discette.where(:slug => params[:slug].downcase).first_or_initialize
      new_discette.name = params[:name]
      new_discette.description = params[:description]
      if new_discette.save!
        render json: new_discette.as_json
      else
        return render_json_error('Error creating discette')
      end
    end

    def update_discette
      discette = Drive::Discette.find(params[:id])
      discette.name = params[:name]
      discette.slug = params[:slug]
      discette.description = params[:description]
      if discette.save!
        render json: discette.as_json
      else
        return render_json_error('Error updating discette')
      end
    end

    # TODO refactor to minimise duplication b/n here and section controller
    def create_section
      subdomain_lower = params[:subdomain_lower].downcase
      user_id = params[:user_id] || current_user.id

      section_category = create_category_for_section subdomain_lower, params[:description]

      # TODO - ensure section does not already exist
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

      section_owner = new_section.section_users.where(:user_id => user_id).first_or_initialize

      # TODO - use flag tzu for below:
      section_owner.role = "owner"
      section_owner.save!

      if new_section.save!
        render json: new_section.as_json
      else
        return render_json_error('Error creating section')
      end
    end

    def update_section
      section = Drive::Section.find(params[:id])
      section_discette = Drive::Discette.find_by_id(params[:discette_id])
      return render_json_error('Discette not found') unless section_discette

      subdomain_lower = params[:subdomain_lower].downcase
      user_id = params[:user_id] || current_user.id
      section_category = create_category_for_section subdomain_lower, params[:description]

      section.name = params[:name]
      section.subdomain_lower = subdomain_lower
      section.discette = section_discette

      section.category = section_category
      return render_json_error(section) unless section.save

      section_owner = section.section_users.where(:user_id => user_id).first_or_initialize

      # TODO - use flag tzu for below:
      section_owner.role = "owner"
      section_owner.save!

      if section.save!
        render json: section.as_json
      else
        return render_json_error('Error updating section')
      end
    end

    def all_sections
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


  end
end
