module Drive
  require 'current_user'

  class PassthroughController < Drive::ApplicationController
    include CurrentUser

    layout false
    # before_action :verify_host_param, except: [:get_or_add_site, :get_sites]

    def latest
      unless(params[:host] || params[:slug])
        return render_json_error "Incorrect parameters"
      end

      if params[:slug]
        site_record = Drive::DiscourseSite.where(:slug => params[:slug]).first
        host = site_record.base_url
      else
        # site_record = Drive::DiscourseSite.where(:base_url => params[:host]).first
        # host = site_record.base_url
        host = params[:host]
      end

       # "https://meta.discourse.org"
      conn = get_connection host
      path = "/latest.json"
      pass_through_request conn, path

      # response = conn.get path
      # rb = JSON.parse response.body

      # if (response.status == 200)
      #   return render json: rb
      # else
      #   return render_json_error "Sorry, there has been an error"
      # end

    end


    def topic_details
      unless(params[:host] && params[:topic_id] )
        return render_json_error 'Incorrect parameters'
      end
      conn = get_connection params[:host]

      path = '/t/' + params[:topic_id] + '.json'
      pass_through_request conn, path
    end


    private

    # def verify_host_param
    #   unless(params[:host] )
    #     return render json: {"error" => {"message" => "incorrect params"}}
    #   end
    # end

    # def remote_site_info conn
    #   about_response = conn.get '/about.json'     # GET http://sushi.com/nigiri/sake.json
    #   rb = about_response.body
    #   if about_response.status == 200
    #     about_json = (JSON.parse about_response.body)['about']
    #     about_json['host_url'] = conn.url_prefix.to_s.downcase
    #     # params[:host]
    #     root_response = conn.get '/'
    #     page = Nokogiri::HTML(root_response.body)
    #     favicon_url = page.css('link[rel="icon"]')[0].attributes['href'].value rescue nil
    #     about_json['favicon_url'] = favicon_url
    #     apple_touch_icon_url = page.css('link[rel="apple-touch-icon"]')[0].attributes['href'].value rescue nil
    #     about_json['apple_touch_icon_url'] = apple_touch_icon_url
    #     return about_json
    #   else
    #     return {"error" => {"message" => "sorry, there has been an error"}}
    #   end
    # end

    # def create_site_record site_info
    #   uri = URI.parse site_info['host_url']
    #   new_site = Offcourse::DiscourseSite.where(:base_url => site_info['host_url']).first_or_initialize
    #   new_site.meta = site_info
    #   new_site.slug = uri.hostname.gsub( ".","_")
    #   new_site.display_name = site_info['title']
    #   new_site.description = site_info['description']
    #   new_site.logo_url = site_info['favicon_url']
    #   new_site.save!
    #   return new_site
    # end



  end
end
