module Drive
  class DiscourseSite < ActiveRecord::Base
    self.table_name = "discourse_sites"

    serialize :meta, JSON

    def self.create_from_url url
      uri = URI.parse(url)
      # strip out any trailing parts
      base_url = "#{uri.scheme}://#{uri.host}"
      discourse_client = Drive::DiscourseClient.new base_url
      site_info = discourse_client.site_info
      if site_info["error"]
        return nil
      else
        new_site = Drive::DiscourseSite.create_site_record site_info
        return new_site
      end
    end

    def self.create_site_record site_info
      # uri = URI.parse site_info['host_url']
      new_site = Drive::DiscourseSite.where(:slug => site_info['slug']).first_or_initialize
      new_site.meta = {}
      # site_info
      new_site.base_url = site_info['host_url']
      new_site.slug = site_info['slug']
      new_site.display_name = site_info['title']
      new_site.description = site_info['description']
      new_site.logo_url = site_info['favicon_url']
      new_site.save!
      return new_site
    end

  end
end