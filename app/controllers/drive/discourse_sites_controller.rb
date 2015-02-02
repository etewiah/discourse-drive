module Drive
  require 'current_user'

  class DiscourseSitesController < Drive::ApplicationController
    include CurrentUser

    layout false
    # before_action :verify_host_param, except: [:get_or_add_site, :get_sites]


    # def categories
    #   unless(params[:host] || params[:slug] )
    #     return render json: {"error" => {"message" => "incorrect params"}}
    #   end

    #   if params[:slug]
    #     site_record = Drive::DiscourseSite.where(:slug => params[:slug]).first
    #     host = site_record.base_url
    #   else
    #     site_record = Drive::DiscourseSite.where(:base_url => params[:host]).first
    #     host = site_record.base_url
    #     # host = params[:host]
    #   end

    #   conn = get_connection host
    #   # pass_through_request conn, "/categories.json"

    #   response = conn.get "/categories.json"
    #   rb = JSON.parse response.body

    #   if (response.status == 200) && rb["category_list"]
    #     return render json: { categories: rb["category_list"]["categories"],
    #                           site_details: site_record.as_json }
    #   else
    #     return render json: {"error" => {"message" => "sorry, there has been an error"}}
    #   end
    # end

    # def topics_per_category
    #   if params[:slug]
    #     site_record = Drive::DiscourseSite.where(:slug => params[:slug]).first
    #     host = site_record.base_url
    #   else
    #     host = params[:host]
    #   end

    #   unless(host && params[:category] )
    #     return render json: {"error" => {"message" => "incorrect params"}}
    #   end
    #   conn = get_connection host
    #   page_number = params[:page_number] || "1"
    #   # categories url has 0 based index for pages which is a bit annoying
    #   discourse_page_number = page_number.to_i > 0 ? page_number.to_i - 1 : 0
    #   path = "/c/" + params[:category] + "/l/latest.json?page=" + discourse_page_number.to_s
    #   # '/c/' + params[:category] + '.json'
    #   # pass_through_request conn, path
    #   response = conn.get path
    #   rb = JSON.parse response.body

    #   if (response.status == 200) && rb["topic_list"]
    #     return render json: { topic_list: rb["topic_list"],
    #                           category: params[:category] }
    #   else
    #     return render json: {"error" => {"message" => "sorry, there has been an error"}}
    #   end
    # end



    def get_sites
      # current_section = get_current_section
      # binding.pry
      site_records = Drive::DiscourseSite.all
      return render json: site_records.as_json, root: false
    end

    # def passthrough
    #   path = "/#{params[:target]}.json"
    #   host = host_from_params
    #   conn = get_connection host
    #   path = path
    #   pass_through_request conn, path
    # end

    def latest
      if params[:category]
        path = "/c/#{params[:category]}.json"
      else
        path = "latest.json"
      end
      host = host_from_params
      conn = get_connection host
      path = path
      pass_through_request conn, path
    end



    def about
      host = host_from_params
      conn = get_connection host
      path = "/about.json"
      pass_through_request conn, path
    end

    def categories
      host = host_from_params
      conn = get_connection host
      path = "/categories.json"
      pass_through_request conn, path
    end


    def topic_details
      unless(params[:slug] && params[:topic_id] )
        return render_json_error 'Incorrect parameters'
      end
      # site_record = Drive::DiscourseSite.where(:slug => params[:slug]).first
      host = host_from_params
      conn = get_connection host

      path = '/t/' + params[:topic_id] + '.json'
      pass_through_request conn, path
    end

    private


    def host_from_params
      unless(params[:slug])
        return render_json_error "Incorrect parameters"
      end

      site_record = Drive::DiscourseSite.where(:slug => params[:slug]).first
      host = site_record.base_url
    end


    def remote_site_info conn
      about_response = conn.get '/about.json'     # GET http://sushi.com/nigiri/sake.json
      rb = about_response.body
      if about_response.status == 200
        about_json = (JSON.parse about_response.body)['about']
        about_json['host_url'] = conn.url_prefix.to_s.downcase
        # params[:host]
        root_response = conn.get '/'
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

    def create_site_record site_info, section
      section_meta = section.meta || { "sites" => [] }
      uri = URI.parse site_info['host_url']
      new_site = {}
      binding.pry 
      # Drive::DiscourseSite.where(:base_url => site_info['host_url']).first_or_initialize
      # new_site["meta"] = site_info
      new_site["slug"] = uri.hostname.gsub( ".","_")
      new_site["display_name"] = site_info['title']
      new_site["description"] = site_info['description']
      new_site["logo_url"] = site_info['favicon_url']
      
      if section_meta["sites"]
        section_meta["sites"].push new_site
      else
        section_meta["sites"] = [new_site]
      end
      section.meta = section_meta
      section.save!
      binding.pry
      return new_site
    end

  end
end
